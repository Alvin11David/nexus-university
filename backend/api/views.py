from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.db import transaction, models
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, CourseUnit, OtpVerification, StudentRecord, Profile, Registrar, FeeAssignment, StudentGrade, Activity, SignUp
from .serializers import (
    LoginSerializer,
    PasswordResetSerializer,
    SendSignupOtpSerializer,
    SignupSerializer,
    StudentRecordSerializer,
    ValidateStudentRecordSerializer,
    VerifySignupOtpSerializer,
)

from .serializers import ProgramSerializer, AcademicEventSerializer
from .models import Program, AcademicEvent
from .serializers import AnnouncementSerializer
from .models import Announcement
from .serializers import CourseSerializer, CourseUnitSerializer, AssignmentSerializer, ProfileSerializer, RegistrarSerializer, FeeAssignmentSerializer, StudentGradeSerializer, ActivitySerializer, SignUpSerializer
from .models import Assignment, Quiz, QuizQuestion, QuizAttempt, ExamResult, Message, MessageDraft, UserSettings, Enrollment, LiveSession, Classroom, ClassroomEnrollment, Submission, Schedule, StudentFee


OTP_TTL_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_PER_HOUR = 5
OTP_MAX_ATTEMPTS = 5


def normalize_email(value: str) -> str:
    return value.strip().lower()


def validate_email_format(email: str) -> None:
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ValueError("A valid email address is required.")


def get_user_model_by_email(email: str):
    User = get_user_model()
    return User.objects.filter(email__iexact=email).first()


def resolve_email_from_identifier(identifier: str) -> str | None:
    identifier = identifier.strip()
    if "@" in identifier:
        return normalize_email(identifier)

    student = StudentRecord.objects.filter(
        models.Q(registration_number=identifier) | models.Q(student_number=identifier)
    ).first()
    return normalize_email(student.email) if student else None


def infer_role_from_email(email: str) -> str:
    normalized_email = normalize_email(email)
    if normalized_email.endswith("@lecturer.com"):
        return "lecturer"
    if normalized_email.endswith("@registrar.com"):
        return "registrar"
    return "student"


def serialize_profile(user, role: str | None = None) -> dict | None:
    if not user:
        return None

    normalized_email = normalize_email(user.email or "")
    profile_role = role or infer_role_from_email(normalized_email)

    profile_data: dict = {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.get_full_name() if user.get_full_name() else None,
        "role": profile_role,
        "student_number": None,
        "registration_number": None,
        "department": None,
        "college": None,
        "programme": None,
        "phone": None,
        "bio": None,
    }

    student = StudentRecord.objects.filter(email__iexact=user.email).first()
    if student:
        profile_data.update(
            {
                "full_name": student.full_name,
                "student_number": student.student_number,
                "registration_number": student.registration_number,
                "college": student.college,
                "programme": student.programme,
                "phone": student.phone,
            }
        )

    return profile_data


def generate_full_name_from_email(email: str) -> str:
    name_part = email.split("@", 1)[0] or "student"
    pieces = [
        piece
        for piece in name_part.replace(".", " ").replace("_", " ").replace("-", " ").split()
        if piece
    ]
    if not pieces:
        return "New Student"
    return " ".join(piece.capitalize() for piece in pieces)


def generate_otp() -> str:
    return f"{secrets.randbelow(10000):04d}"


def build_otp_hash(email: str, otp: str, nonce: str) -> str:
    raw = f"{email}|{otp}|{nonce}|{settings.OTP_SECRET}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def serialize_student_record(record: StudentRecord) -> dict:
    return StudentRecordSerializer(
        {
            "id": str(record.id),
            "full_name": record.full_name,
            "registration_number": record.registration_number,
            "student_number": record.student_number,
            "email": record.email,
            "is_registered": record.is_registered,
        }
    ).data


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "nexus-backend"})


class ValidateStudentRecordView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ValidateStudentRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        registration_number = serializer.validated_data["registrationNumber"].strip()
        student_number = serializer.validated_data["studentNumber"].strip()
        email = normalize_email(serializer.validated_data["email"])

        try:
            validate_email_format(email)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            record, created = StudentRecord.objects.get_or_create(
                registration_number=registration_number,
                student_number=student_number,
                defaults={
                    "email": email,
                    "full_name": generate_full_name_from_email(email),
                    "is_registered": False,
                },
            )

            if not created and record.is_registered:
                return Response(
                    {"detail": "This student account is already registered. Please sign in instead."},
                    status=status.HTTP_409_CONFLICT,
                )

            if created:
                record.email = email
                record.full_name = generate_full_name_from_email(email)
                record.is_registered = False
                record.save(update_fields=["email", "full_name", "is_registered", "updated_at"])

        return Response(serialize_student_record(record), status=status.HTTP_200_OK)


class SendSignupOtpView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = SendSignupOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = normalize_email(serializer.validated_data["email"])
        student_record_id = serializer.validated_data.get("studentRecordId") or None

        try:
            validate_email_format(email)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        one_hour_ago = now - timedelta(hours=1)
        cooldown_ago = now - timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)

        recent_count = OtpVerification.objects.filter(
            email=email,
            purpose=OtpVerification.PURPOSE_SIGNUP,
            created_at__gte=one_hour_ago,
        ).count()

        if recent_count >= OTP_MAX_PER_HOUR:
            return Response(
                {"detail": "Too many OTP requests. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        cooldown_exists = OtpVerification.objects.filter(
            email=email,
            purpose=OtpVerification.PURPOSE_SIGNUP,
            verified=False,
            created_at__gte=cooldown_ago,
        ).exists()

        if cooldown_exists:
            return Response(
                {"detail": "Please wait at least 60 seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        student_record = None
        if student_record_id:
            student_record = StudentRecord.objects.filter(id=student_record_id).first()

        otp = generate_otp()
        nonce = secrets.token_hex(16)
        otp_hash = build_otp_hash(email, otp, nonce)

        verification = OtpVerification.objects.create(
            student_record=student_record,
            email=email,
            purpose=OtpVerification.PURPOSE_SIGNUP,
            otp_hash=otp_hash,
            nonce=nonce,
            verified=False,
            attempts=0,
            max_attempts=OTP_MAX_ATTEMPTS,
            expires_at=now + timedelta(minutes=OTP_TTL_MINUTES),
        )

        from_email = settings.EMAIL_HOST_USER or settings.DEFAULT_FROM_EMAIL
        if not from_email or from_email.endswith("nexus-university.local"):
            return Response(
                {
                    "detail": (
                        "Set EMAIL_HOST_USER (your Gmail address) or DEFAULT_FROM_EMAIL "
                        "before sending OTP emails via Gmail SMTP."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        send_mail(
            subject="Your Nexus University verification code",
            message=f"Use this code to continue your Nexus University signup: {otp}",
            from_email=from_email,
            recipient_list=[email],
            fail_silently=not settings.DEBUG,
        )

        return Response(
            {
                "success": True,
                "deliveryChannel": "email",
                "otp": otp if settings.DEBUG else "",
                "verificationId": str(verification.id),
            },
            status=status.HTTP_201_CREATED,
        )


class VerifySignupOtpView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = VerifySignupOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = normalize_email(serializer.validated_data["email"])
        otp = serializer.validated_data["otp"].strip()

        try:
            validate_email_format(email)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not otp.isdigit() or len(otp) != 4:
            return Response({"valid": False, "reason": "invalid-format"}, status=status.HTTP_200_OK)

        verification = (
            OtpVerification.objects.filter(
                email=email,
                purpose=OtpVerification.PURPOSE_SIGNUP,
                verified=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not verification:
            return Response({"valid": False, "reason": "not-found"}, status=status.HTTP_200_OK)

        if verification.attempts >= verification.max_attempts:
            return Response({"valid": False, "reason": "max-attempts"}, status=status.HTTP_200_OK)

        if timezone.now() > verification.expires_at:
            return Response({"valid": False, "reason": "expired"}, status=status.HTTP_200_OK)

        if build_otp_hash(email, otp, verification.nonce) != verification.otp_hash:
            verification.attempts += 1
            verification.save(update_fields=["attempts"])
            return Response({"valid": False, "reason": "invalid-code"}, status=status.HTTP_200_OK)

        verification.verified = True
        verification.verified_at = timezone.now()
        verification.save(update_fields=["verified", "verified_at"])

        return Response({"valid": True}, status=status.HTTP_200_OK)


class AuthLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"].strip()
        password = serializer.validated_data["password"]
        email = resolve_email_from_identifier(identifier)
        if not email:
            return Response(
                {"detail": "No account associated with this identifier."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "uid": str(user.id),
                    "email": user.email,
                    "displayName": user.get_full_name() or None,
                },
                "profile": serialize_profile(user),
            },
            status=status.HTTP_200_OK,
        )


class AuthLogoutView(APIView):
    def post(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        Token.objects.filter(user=user).delete()
        return Response({"success": True}, status=status.HTTP_200_OK)


class AuthSignupView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = normalize_email(serializer.validated_data["email"])
        password = serializer.validated_data["password"]
        full_name = serializer.validated_data["fullName"].strip()
        registration_number = serializer.validated_data.get("registrationNumber") or None
        student_number = serializer.validated_data.get("studentNumber") or None
        role = serializer.validated_data.get("role") or "student"
        department = serializer.validated_data.get("department") or None
        college = serializer.validated_data.get("college") or None
        programme = serializer.validated_data.get("programme") or None

        try:
            validate_email_format(email)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "An account with this email already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        first_name, *last_name_parts = full_name.split()
        last_name = " ".join(last_name_parts) if last_name_parts else ""
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        if role == "student" and registration_number and student_number:
            student_record, created = StudentRecord.objects.get_or_create(
                registration_number=registration_number,
                student_number=student_number,
                defaults={
                    "email": email,
                    "full_name": full_name,
                    "is_registered": True,
                    "college": college,
                    "programme": programme,
                },
            )
            if not created:
                student_record.email = email
                student_record.full_name = full_name
                student_record.is_registered = True
                student_record.college = college or student_record.college
                student_record.programme = programme or student_record.programme
                student_record.save(update_fields=["email", "full_name", "is_registered", "college", "programme", "updated_at"])

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "uid": str(user.id),
                    "email": user.email,
                    "displayName": user.get_full_name() or None,
                },
                "profile": serialize_profile(user, role),
            },
            status=status.HTTP_201_CREATED,
        )


class AuthMeView(APIView):
    def get(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(
            {
                "user": {
                    "uid": str(user.id),
                    "email": user.email,
                    "displayName": user.get_full_name() or None,
                },
                "profile": serialize_profile(user),
            },
            status=status.HTTP_200_OK,
        )


class AuthResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"].strip()
        new_password = serializer.validated_data["newPassword"]

        email = resolve_email_from_identifier(identifier)
        if not email:
            return Response(
                {"detail": "No account associated with this identifier."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = get_user_model_by_email(email)
        if not user:
            return Response(
                {"detail": "No user account found for this email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"success": True}, status=status.HTTP_200_OK)


class ProgramListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        programs = Program.objects.all()
        data = [
            {
                "id": str(p.id),
                "title": p.title,
                "code": p.code,
                "description": p.description,
                "department_name": p.department_name,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in programs
        ]

        return Response(data)


class AcademicCalendarView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        events = AcademicEvent.objects.all()
        data = [
            {
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "date": e.date.isoformat(),
                "dueDate": e.due_date.isoformat() if e.due_date else None,
                "type": e.type,
                "isActive": e.is_active,
            }
            for e in events
        ]

        return Response(data)


class AnnouncementListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        author_id = request.query_params.get("author_id")
        course_ids = request.query_params.get("course_ids")
        qs = Announcement.objects.all()
        if author_id:
            qs = qs.filter(author_id=author_id)
        if course_ids:
            ids = [c.strip() for c in course_ids.split(",") if c.strip()]
            qs = qs.filter(course_id__in=ids)

        data = [
            {
                "id": str(a.id),
                "course_id": a.course_id,
                "author_id": a.author_id,
                "title": a.title,
                "content": a.content,
                "priority": a.priority,
                "created_at": a.created_at,
            }
            for a in qs
        ]
        return Response(data)

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        content = (request.data.get("content") or "").strip()
        author_id = request.data.get("author_id")
        course_id = request.data.get("course_id")
        priority = request.data.get("priority") or "normal"
        if not title or not content or not author_id:
            return Response(
                {"error": "Missing required fields: title, content, author_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        announcement = Announcement.objects.create(
            title=title,
            content=content,
            author_id=author_id,
            course_id=course_id if course_id else None,
            priority=priority,
        )
        return Response(
            {
                "id": str(announcement.id),
                "course_id": announcement.course_id,
                "author_id": announcement.author_id,
                "title": announcement.title,
                "content": announcement.content,
                "priority": announcement.priority,
                "created_at": announcement.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class AnnouncementDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def delete(self, request, announcement_id):
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            announcement.delete()
            return Response({"success": True})
        except Announcement.DoesNotExist:
            return Response({"error": "Announcement not found"}, status=404)


class AssignmentListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        lecturer_id = request.query_params.get("lecturer_id")
        course_ids = request.query_params.get("course_ids")
        qs = Assignment.objects.all()
        if lecturer_id:
            qs = qs.filter(lecturer_id=lecturer_id)
        if course_ids:
            ids = [c.strip() for c in course_ids.split(",") if c.strip()]
            qs = qs.filter(course_id__in=ids)

        data = [
            {
                "id": str(a.id),
                "lecturer_id": a.lecturer_id,
                "course_id": a.course_id,
                "course_title": a.course_title or "",
                "course_code": a.course_code or "",
                "title": a.title,
                "description": a.description,
                "due_date": a.due_date.isoformat(),
                "total_points": a.total_points,
                "instruction_document_url": a.instruction_document_url,
                "instruction_document_name": a.instruction_document_name,
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in qs
        ]
        return Response(data)

    def post(self, request):
        lecturer_id = request.data.get("lecturer_id")
        course_id = request.data.get("course_id")
        title = (request.data.get("title") or "").strip()
        description = request.data.get("description") or ""
        due_date = request.data.get("due_date")
        total_points = request.data.get("total_points") or 100
        course_title = request.data.get("course_title") or ""
        course_code = request.data.get("course_code") or ""
        status_value = request.data.get("status") or "pending"
        instruction_document_url = request.data.get("instruction_document_url")
        instruction_document_name = request.data.get("instruction_document_name") or ""

        if not lecturer_id or not course_id or not title or not due_date:
            return Response(
                {"error": "Missing required fields: lecturer_id, course_id, title, due_date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            assignment = Assignment.objects.create(
                lecturer_id=lecturer_id,
                course_id=course_id,
                course_title=course_title,
                course_code=course_code,
                title=title,
                description=description,
                due_date=due_date,
                total_points=int(total_points),
                status=status_value,
                instruction_document_url=instruction_document_url,
                instruction_document_name=instruction_document_name,
            )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "id": str(assignment.id),
                "lecturer_id": assignment.lecturer_id,
                "course_id": assignment.course_id,
                "course_title": assignment.course_title,
                "course_code": assignment.course_code,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date.isoformat(),
                "total_points": assignment.total_points,
                "instruction_document_url": assignment.instruction_document_url,
                "instruction_document_name": assignment.instruction_document_name,
                "status": assignment.status,
                "created_at": assignment.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class QuizListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        lecturer_id = request.query_params.get("lecturer_id")
        from datetime import datetime
        from django.utils import timezone

        now = timezone.now()
        qs = Quiz.objects.filter(status="active").filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
        )
        if lecturer_id:
            qs = qs.filter(lecturer_id=lecturer_id)
        qs = qs.order_by("-created_at")

        data = [
            {
                "id": str(q.id),
                "lecturer_id": q.lecturer_id,
                "course_id": q.course_id,
                "title": q.title,
                "description": q.description,
                "time_limit_minutes": q.time_limit_minutes,
                "max_attempts": q.max_attempts,
                "passing_score": q.passing_score,
                "show_answers": q.show_answers,
                "status": q.status,
                "start_date": q.start_date.isoformat() if q.start_date else None,
                "end_date": q.end_date.isoformat() if q.end_date else None,
                "created_at": q.created_at.isoformat(),
                "total_questions": q.questions.count(),
                "total_points": sum(
                    q.questions.values_list("points", flat=True)
                ),
            }
            for q in qs
        ]
        return Response(data)

    def post(self, request):
        lecturer_id = request.data.get("lecturer_id")
        course_id = request.data.get("course_id")
        title = (request.data.get("title") or "").strip()
        description = request.data.get("description") or ""
        time_limit_minutes = request.data.get("time_limit_minutes") or 30
        max_attempts = request.data.get("max_attempts") or 1
        passing_score = request.data.get("passing_score") or 60
        show_answers = bool(request.data.get("show_answers", True))
        status_value = request.data.get("status") or "draft"
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        if not lecturer_id or not course_id or not title:
            return Response(
                {"error": "Missing required fields: lecturer_id, course_id, title."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quiz = Quiz.objects.create(
                lecturer_id=lecturer_id,
                course_id=course_id,
                title=title,
                description=description,
                time_limit_minutes=int(time_limit_minutes),
                max_attempts=int(max_attempts),
                passing_score=int(passing_score),
                show_answers=show_answers,
                status=status_value,
                start_date=start_date,
                end_date=end_date,
            )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "id": str(quiz.id),
                "lecturer_id": quiz.lecturer_id,
                "course_id": quiz.course_id,
                "title": quiz.title,
                "description": quiz.description,
                "time_limit_minutes": quiz.time_limit_minutes,
                "max_attempts": quiz.max_attempts,
                "passing_score": quiz.passing_score,
                "show_answers": quiz.show_answers,
                "status": quiz.status,
                "start_date": quiz.start_date.isoformat() if quiz.start_date else None,
                "end_date": quiz.end_date.isoformat() if quiz.end_date else None,
                "created_at": quiz.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class StudentListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        students = StudentRecord.objects.filter(is_registered=True)
        data = [
            {
                "id": str(s.id),
                "full_name": s.full_name,
                "registration_number": s.registration_number,
                "student_number": s.student_number,
                "email": s.email,
            }
            for s in students
        ]
        return Response(data)


class LecturerSummaryView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        lecturer_id = request.query_params.get("lecturer_id")
        if not lecturer_id:
            return Response(
                {"error": "lecturer_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignments_count = Assignment.objects.filter(lecturer_id=lecturer_id).count()
        quizzes_count = Quiz.objects.filter(lecturer_id=lecturer_id).count()
        announcements_count = Announcement.objects.filter(author_id=lecturer_id).count()
        messages_received = Message.objects.filter(to_user_id=lecturer_id, is_deleted_by_recipient=False).count()
        messages_sent = Message.objects.filter(from_user_id=lecturer_id, is_deleted_by_sender=False).count()

        return Response(
            {
                "assignments_count": assignments_count,
                "quizzes_count": quizzes_count,
                "announcements_count": announcements_count,
                "messages_received": messages_received,
                "messages_sent": messages_sent,
            }
        )


class QuizDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            questions = quiz.questions.all().values(
                "id",
                "question",
                "options",
                "correct_answer",
                "points",
                "explanation",
            )
            return Response(
                {
                    "id": str(quiz.id),
                    "course_id": quiz.course_id,
                    "title": quiz.title,
                    "description": quiz.description,
                    "time_limit_minutes": quiz.time_limit_minutes,
                    "max_attempts": quiz.max_attempts,
                    "passing_score": quiz.passing_score,
                    "show_answers": quiz.show_answers,
                    "status": quiz.status,
                    "start_date": quiz.start_date.isoformat()
                    if quiz.start_date
                    else None,
                    "end_date": quiz.end_date.isoformat() if quiz.end_date else None,
                    "created_at": quiz.created_at.isoformat(),
                    "questions": list(questions),
                }
            )
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)


class QuizSubmitView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        quiz_id = request.data.get("quiz_id")
        student_id = request.data.get("student_id")
        answers = request.data.get("answers", {})
        time_taken = request.data.get("time_taken", 0)

        try:
            quiz = Quiz.objects.get(id=quiz_id)

            # Calculate score
            questions = quiz.questions.all()
            total_score = 0
            total_points = 0

            for question in questions:
                total_points += question.points
                if str(question.id) in answers:
                    if answers[str(question.id)] == question.correct_answer:
                        total_score += question.points

            # Create attempt record
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                student_id=student_id,
                answers=answers,
                score=total_score,
                total_points=total_points,
                time_taken=time_taken,
            )

            return Response(
                {
                    "id": str(attempt.id),
                    "score": total_score,
                    "total_points": total_points,
                    "completed_at": attempt.completed_at.isoformat(),
                }
            )
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class StudentResultsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, student_id):
        try:
            # Fetch exam results
            exam_results = ExamResult.objects.filter(student_id=student_id).order_by(
                "-academic_year", "-semester", "course_code"
            )

            exam_data = [
                {
                    "id": str(r.id),
                    "course_id": r.course_id,
                    "course_title": r.course_title,
                    "course_code": r.course_code,
                    "credits": r.credits,
                    "academic_year": r.academic_year,
                    "semester": r.semester,
                    "assignment1": r.assignment1,
                    "assignment2": r.assignment2,
                    "midterm": r.midterm,
                    "participation": r.participation,
                    "final_exam": r.final_exam,
                    "marks": r.marks,
                    "grade": r.grade,
                    "grade_point": float(r.grade_point),
                    "remark": r.remark,
                }
                for r in exam_results
            ]

            # Fetch quiz results
            quiz_attempts = QuizAttempt.objects.filter(student_id=student_id).order_by(
                "-completed_at"
            )

            quiz_data = [
                {
                    "id": str(a.id),
                    "quiz_id": a.quiz.id,
                    "quiz_title": a.quiz.title,
                    "score": a.score,
                    "total_points": a.total_points,
                    "percentage": int((a.score / a.total_points * 100) if a.total_points > 0 else 0),
                    "completed_at": a.completed_at.isoformat(),
                    "time_taken": a.time_taken,
                    "status": "completed",
                }
                for a in quiz_attempts
            ]

            return Response({
                "exam_results": exam_data,
                "quiz_results": quiz_data,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class StudentExamResultsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, student_id):
        try:
            exam_results = ExamResult.objects.filter(student_id=student_id).order_by(
                "-academic_year", "-semester", "course_code"
            )

            data = [
                {
                    "id": str(r.id),
                    "course_id": r.course_id,
                    "course_title": r.course_title,
                    "course_code": r.course_code,
                    "credits": r.credits,
                    "academic_year": r.academic_year,
                    "semester": r.semester,
                    "assignment1": r.assignment1,
                    "assignment2": r.assignment2,
                    "midterm": r.midterm,
                    "participation": r.participation,
                    "final_exam": r.final_exam,
                    "marks": r.marks,
                    "grade": r.grade,
                    "grade_point": float(r.grade_point),
                    "remark": r.remark,
                }
                for r in exam_results
            ]

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class StudentQuizResultsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, student_id):
        try:
            quiz_attempts = QuizAttempt.objects.filter(student_id=student_id).order_by(
                "-completed_at"
            )

            data = [
                {
                    "id": str(a.id),
                    "quiz_id": a.quiz.id,
                    "quiz_title": a.quiz.title,
                    "score": a.score,
                    "total_points": a.total_points,
                    "percentage": int((a.score / a.total_points * 100) if a.total_points > 0 else 0),
                    "completed_at": a.completed_at.isoformat(),
                    "time_taken": a.time_taken,
                    "status": "completed",
                }
                for a in quiz_attempts
            ]

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class MessageListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, user_id):
        try:
            view_type = request.query_params.get("view", "inbox")
            search_query = request.query_params.get("search", "").strip()

            if view_type == "inbox":
                messages = Message.objects.filter(
                    to_user_id=user_id,
                    is_deleted_by_recipient=False
                ).order_by("-created_at")
            elif view_type == "sent":
                messages = Message.objects.filter(
                    from_user_id=user_id,
                    is_deleted_by_sender=False
                ).order_by("-created_at")
            elif view_type == "starred":
                messages = Message.objects.filter(
                    is_starred=True
                ).filter(
                    models.Q(to_user_id=user_id) | models.Q(from_user_id=user_id)
                ).order_by("-created_at")
            elif view_type == "archived":
                messages = Message.objects.filter(
                    is_archived=True
                ).filter(
                    models.Q(to_user_id=user_id) | models.Q(from_user_id=user_id)
                ).order_by("-created_at")
            else:
                messages = Message.objects.none()

            # Apply search filter
            if search_query:
                messages = messages.filter(
                    models.Q(subject__icontains=search_query) |
                    models.Q(body__icontains=search_query)
                )

            data = [
                {
                    "id": str(m.id),
                    "from_user_id": m.from_user_id,
                    "to_user_id": m.to_user_id,
                    "subject": m.subject,
                    "body": m.body[:100] + "..." if len(m.body) > 100 else m.body,
                    "is_read": m.is_read,
                    "is_starred": m.is_starred,
                    "is_archived": m.is_archived,
                    "created_at": m.created_at.isoformat(),
                    "attachment_name": m.attachment_name,
                }
                for m in messages
            ]

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class MessageDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)

            # Mark as read if recipient viewing
            if request.query_params.get("mark_read") == "true":
                if message.to_user_id == request.query_params.get("user_id"):
                    message.is_read = True
                    message.save(update_fields=["is_read"])

            data = {
                "id": str(message.id),
                "from_user_id": message.from_user_id,
                "to_user_id": message.to_user_id,
                "subject": message.subject,
                "body": message.body,
                "is_read": message.is_read,
                "is_starred": message.is_starred,
                "is_archived": message.is_archived,
                "created_at": message.created_at.isoformat(),
                "attachment_url": message.attachment_url,
                "attachment_name": message.attachment_name,
                "attachment_size": message.attachment_size,
            }

            return Response(data)
        except Message.DoesNotExist:
            return Response({"error": "Message not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class MessageSendView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            from_user_id = request.data.get("from_user_id")
            to_user_id = request.data.get("to_user_id")
            subject = request.data.get("subject", "").strip()
            body = request.data.get("body", "").strip()
            attachment_url = request.data.get("attachment_url")
            attachment_name = request.data.get("attachment_name")
            attachment_size = request.data.get("attachment_size")
            draft_id = request.data.get("draft_id")

            if not all([from_user_id, to_user_id, subject, body]):
                return Response(
                    {"error": "Missing required fields"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            message = Message.objects.create(
                from_user_id=from_user_id,
                to_user_id=to_user_id,
                subject=subject,
                body=body,
                is_read=False,
                is_starred=False,
                is_archived=False,
                attachment_url=attachment_url,
                attachment_name=attachment_name,
                attachment_size=attachment_size,
            )

            if draft_id:
                MessageDraft.objects.filter(id=draft_id).delete()

            return Response(
                {
                    "id": str(message.id),
                    "created_at": message.created_at.isoformat(),
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class MessageActionView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)
            action = request.data.get("action")
            user_id = request.data.get("user_id")

            if action == "star":
                message.is_starred = not message.is_starred
                message.save(update_fields=["is_starred"])
            elif action == "archive":
                message.is_archived = not message.is_archived
                message.save(update_fields=["is_archived"])
            elif action == "delete":
                if message.from_user_id == user_id:
                    message.is_deleted_by_sender = True
                    message.save(update_fields=["is_deleted_by_sender"])
                elif message.to_user_id == user_id:
                    message.is_deleted_by_recipient = True
                    message.save(update_fields=["is_deleted_by_recipient"])
            elif action == "read":
                message.is_read = True
                message.save(update_fields=["is_read"])

            return Response({"success": True})
        except Message.DoesNotExist:
            return Response({"error": "Message not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DraftListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, user_id):
        try:
            drafts = MessageDraft.objects.filter(user_id=user_id).order_by("-updated_at")

            data = [
                {
                    "id": str(d.id),
                    "to_user_id": d.to_user_id,
                    "subject": d.subject or "(no subject)",
                    "body": (d.body[:100] + "..." if d.body and len(d.body) > 100 else d.body) or "",
                    "created_at": d.created_at.isoformat(),
                    "updated_at": d.updated_at.isoformat(),
                }
                for d in drafts
            ]

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DraftSaveView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            user_id = request.data.get("user_id")
            draft_id = request.data.get("draft_id")
            to_user_id = request.data.get("to_user_id")
            subject = request.data.get("subject")
            body = request.data.get("body")

            if draft_id:
                draft = MessageDraft.objects.get(id=draft_id, user_id=user_id)
                draft.to_user_id = to_user_id
                draft.subject = subject
                draft.body = body
                draft.save()
            else:
                draft = MessageDraft.objects.create(
                    user_id=user_id,
                    to_user_id=to_user_id,
                    subject=subject,
                    body=body,
                )

            return Response({
                "id": str(draft.id),
                "updated_at": draft.updated_at.isoformat(),
            }, status=status.HTTP_201_CREATED)
        except MessageDraft.DoesNotExist:
            return Response({"error": "Draft not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DraftDeleteView(APIView):
    authentication_classes = []
    permission_classes = []

    def delete(self, request, draft_id):
        try:
            user_id = request.query_params.get("user_id")
            MessageDraft.objects.filter(id=draft_id, user_id=user_id).delete()
            return Response({"success": True})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class StudentProfileView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, student_id):
        try:
            student = StudentRecord.objects.get(id=student_id)

            data = {
                "id": str(student.id),
                "full_name": student.full_name,
                "email": student.email,
                "student_number": student.student_number,
                "registration_number": student.registration_number,
                "phone": student.phone or "+256 700 000 000",
                "programme": student.programme or "Bachelor of Science in Computer Science",
                "college": student.college or "Main Campus",
                "year": student.year or "Year 1",
                "blood_type": student.blood_type or "O+",
                "id_card_valid_thru": student.id_card_valid_thru or "Aug 2026",
            }

            return Response(data)
        except StudentRecord.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class StudentSettingsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, user_id):
        try:
            settings, created = UserSettings.objects.get_or_create(user_id=user_id)

            data = {
                "id": str(settings.id),
                "user_id": settings.user_id,
                "theme": settings.theme,
                "notifications_enabled": settings.notifications_enabled,
                "email_notifications": settings.email_notifications,
                "privacy_level": settings.privacy_level,
                "language": settings.language,
                "two_factor_enabled": settings.two_factor_enabled,
            }

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def post(self, request, user_id):
        try:
            settings, created = UserSettings.objects.get_or_create(user_id=user_id)

            # Update settings from request data
            if "theme" in request.data:
                settings.theme = request.data["theme"]
            if "notifications_enabled" in request.data:
                settings.notifications_enabled = request.data["notifications_enabled"]
            if "email_notifications" in request.data:
                settings.email_notifications = request.data["email_notifications"]
            if "privacy_level" in request.data:
                settings.privacy_level = request.data["privacy_level"]
            if "language" in request.data:
                settings.language = request.data["language"]
            if "two_factor_enabled" in request.data:
                settings.two_factor_enabled = request.data["two_factor_enabled"]

            settings.save()

            data = {
                "id": str(settings.id),
                "user_id": settings.user_id,
                "theme": settings.theme,
                "notifications_enabled": settings.notifications_enabled,
                "email_notifications": settings.email_notifications,
                "privacy_level": settings.privacy_level,
                "language": settings.language,
                "two_factor_enabled": settings.two_factor_enabled,
            }

            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class CourseListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = Course.objects.all()
        college = request.query_params.get("college")
        if college:
            qs = qs.filter(college=college)
        serializer = CourseSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        course = Course.objects.create(**serializer.validated_data)
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get_object(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None

    def get(self, request, course_id):
        course = self.get_object(course_id)
        if not course:
            return Response({"error": "Course not found"}, status=404)
        return Response(CourseSerializer(course).data)

    def put(self, request, course_id):
        course = self.get_object(course_id)
        if not course:
            return Response({"error": "Course not found"}, status=404)
        serializer = CourseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for attr, value in serializer.validated_data.items():
            setattr(course, attr, value)
        course.save()
        return Response(CourseSerializer(course).data)

    def delete(self, request, course_id):
        course = self.get_object(course_id)
        if not course:
            return Response({"error": "Course not found"}, status=404)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CourseUnitListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = CourseUnit.objects.all()
        course_id = request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        serializer = CourseUnitSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CourseUnitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        course_id = data.pop("course_id")
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=404)
        unit = CourseUnit.objects.create(course=course, **data)
        return Response(CourseUnitSerializer(unit).data, status=status.HTTP_201_CREATED)


class CourseUnitDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get_object(self, pk):
        try:
            return CourseUnit.objects.get(pk=pk)
        except CourseUnit.DoesNotExist:
            return None

    def put(self, request, unit_id):
        unit = self.get_object(unit_id)
        if not unit:
            return Response({"error": "Course unit not found"}, status=404)
        serializer = CourseUnitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        course_id = data.pop("course_id", None)
        if course_id:
            try:
                unit.course = Course.objects.get(pk=course_id)
            except Course.DoesNotExist:
                return Response({"error": "Course not found"}, status=404)
        for attr, value in data.items():
            setattr(unit, attr, value)
        unit.save()
        return Response(CourseUnitSerializer(unit).data)

    def delete(self, request, unit_id):
        unit = self.get_object(unit_id)
        if not unit:
            return Response({"error": "Course unit not found"}, status=404)
        unit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = Profile.objects.all()
        role = request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        serializer = ProfileSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProfileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        profile = Profile.objects.create(**serializer.validated_data)
        return Response(ProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class ProfileDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get_object(self, pk):
        try:
            return Profile.objects.get(pk=pk)
        except Profile.DoesNotExist:
            return None

    def get(self, request, profile_id):
        profile = self.get_object(profile_id)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)
        return Response(ProfileSerializer(profile).data)

    def put(self, request, profile_id):
        profile = self.get_object(profile_id)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)
        serializer = ProfileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for attr, value in serializer.validated_data.items():
            setattr(profile, attr, value)
        profile.save()
        return Response(ProfileSerializer(profile).data)

    def delete(self, request, profile_id):
        profile = self.get_object(profile_id)
        if not profile:
            return Response({"error": "Profile not found"}, status=404)
        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegistrarDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, user_id):
        try:
            registrar = Registrar.objects.get(user_id=user_id)
        except Registrar.DoesNotExist:
            return Response({"error": "Registrar not found"}, status=404)
        return Response(RegistrarSerializer(registrar).data)

    def put(self, request, user_id):
        try:
            registrar = Registrar.objects.get(user_id=user_id)
        except Registrar.DoesNotExist:
            return Response({"error": "Registrar not found"}, status=404)
        serializer = RegistrarSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for attr, value in serializer.validated_data.items():
            setattr(registrar, attr, value)
        registrar.save()
        return Response(RegistrarSerializer(registrar).data)

    def post(self, request, user_id):
        data = request.data.copy()
        data["user_id"] = user_id
        serializer = RegistrarSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        registrar = Registrar.objects.create(**serializer.validated_data)
        return Response(RegistrarSerializer(registrar).data, status=status.HTTP_201_CREATED)


class FeeAssignmentListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = FeeAssignment.objects.all()
        college = request.query_params.get("college")
        if college:
            qs = qs.filter(college=college)
        serializer = FeeAssignmentSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FeeAssignmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        fee = FeeAssignment.objects.create(**serializer.validated_data)
        return Response(FeeAssignmentSerializer(fee).data, status=status.HTTP_201_CREATED)


class FeeAssignmentDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get_object(self, pk):
        try:
            return FeeAssignment.objects.get(pk=pk)
        except FeeAssignment.DoesNotExist:
            return None

    def put(self, request, fee_id):
        fee = self.get_object(fee_id)
        if not fee:
            return Response({"error": "Fee not found"}, status=404)
        serializer = FeeAssignmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for attr, value in serializer.validated_data.items():
            setattr(fee, attr, value)
        fee.save()
        return Response(FeeAssignmentSerializer(fee).data)

    def delete(self, request, fee_id):
        fee = self.get_object(fee_id)
        if not fee:
            return Response({"error": "Fee not found"}, status=404)
        fee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AcademicCalendarEventListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        events = AcademicEvent.objects.all()
        data = [
            {
                "id": str(e.id),
                "title": e.title,
                "date": e.date.isoformat(),
                "dueDate": e.due_date.isoformat() if e.due_date else None,
                "type": e.type,
                "description": e.description,
                "isActive": e.is_active,
            }
            for e in events
        ]
        return Response(data)

    def post(self, request):
        title = request.data.get("title", "").strip()
        if not title:
            return Response({"error": "Title is required"}, status=400)
        event = AcademicEvent.objects.create(
            title=title,
            description=request.data.get("description", ""),
            date=request.data.get("date"),
            due_date=request.data.get("dueDate"),
            type=request.data.get("type", ""),
            is_active=request.data.get("isActive", True),
        )
        return Response(
            {
                "id": str(event.id),
                "title": event.title,
                "date": event.date.isoformat(),
                "dueDate": event.due_date.isoformat() if event.due_date else None,
                "type": event.type,
                "description": event.description,
                "isActive": event.is_active,
            },
            status=201,
        )


class AcademicCalendarEventDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def put(self, request, event_id):
        try:
            event = AcademicEvent.objects.get(pk=event_id)
        except AcademicEvent.DoesNotExist:
            return Response({"error": "Event not found"}, status=404)
        if "isActive" in request.data:
            event.is_active = request.data["isActive"]
        if "title" in request.data:
            event.title = request.data["title"]
        if "description" in request.data:
            event.description = request.data["description"]
        if "date" in request.data:
            event.date = request.data["date"]
        if "dueDate" in request.data:
            event.due_date = request.data["dueDate"]
        if "type" in request.data:
            event.type = request.data["type"]
        event.save()
        return Response(
            {
                "id": str(event.id),
                "title": event.title,
                "date": event.date.isoformat(),
                "dueDate": event.due_date.isoformat() if event.due_date else None,
                "type": event.type,
                "description": event.description,
                "isActive": event.is_active,
            }
        )

    def delete(self, request, event_id):
        try:
            event = AcademicEvent.objects.get(pk=event_id)
        except AcademicEvent.DoesNotExist:
            return Response({"error": "Event not found"}, status=404)
        event.delete()
        return Response(status=204)


class StudentGradeListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = StudentGrade.objects.all()
        student_id = request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)
        serializer = StudentGradeSerializer(qs, many=True)
        return Response(serializer.data)

    def put(self, request, grade_id):
        try:
            grade = StudentGrade.objects.get(pk=grade_id)
        except StudentGrade.DoesNotExist:
            return Response({"error": "Grade not found"}, status=404)
        serializer = StudentGradeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        for attr, value in serializer.validated_data.items():
            setattr(grade, attr, value)
        grade.save()
        return Response(StudentGradeSerializer(grade).data)


class StudentDashboardView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, student_id):
        try:
            enrolled_courses = Enrollment.objects.filter(student_id=student_id)
            enrolled_course_ids = [e.course_id for e in enrolled_courses if e.course_id]
            enrolled_count = len(enrolled_courses)
            completed_count = enrolled_courses.filter(status="completed").count()

            course_map = {}
            course_ids_for_query = [c for c in enrolled_course_ids if c]
            if course_ids_for_query:
                courses = Course.objects.filter(id__in=course_ids_for_query)
                for c in courses:
                    course_map[str(c.id)] = c

            pending_assignments_count = 0
            assignments_list = []
            if course_ids_for_query:
                assignments_qs = Assignment.objects.filter(course_id__in=course_ids_for_query).order_by("due_date")
                now = timezone.now()
                pending_assignments = [a for a in assignments_qs if a.due_date and a.due_date >= now]

                assignment_ids = [str(a.id) for a in pending_assignments]
                submissions_qs = Submission.objects.filter(assignment_id__in=assignment_ids, student_id=student_id) if assignment_ids else []

                submitted_ids = set(s.submission_id for s in submissions_qs)
                pending_assignments_count = len([a for a in pending_assignments if str(a.id) not in submitted_ids])

                for a in pending_assignments[:10]:
                    course = course_map.get(str(a.course_id))
                    submission = next((s for s in submissions_qs if s.assignment_id == str(a.id)), None)
                    assignments_list.append({
                        "id": str(a.id),
                        "title": a.title,
                        "dueDate": a.due_date.isoformat(),
                        "courseTitle": course.name if course else (a.course_title or "Course"),
                        "courseCode": course.code if course else (a.course_code or ""),
                        "totalPoints": a.total_points,
                        "status": "submitted" if submission and submission.status == "submitted" else "pending",
                        "rawStatus": a.status,
                    })

            # Live sessions for enrolled courses
            live_sessions_list = []
            if course_ids_for_query:
                now = timezone.now()
                sessions_qs = LiveSession.objects.filter(course_id__in=course_ids_for_query).order_by("scheduled_at")
                for s in sessions_qs:
                    start = s.scheduled_at
                    end = start + timedelta(minutes=s.duration_minutes)
                    is_live = now >= start and now <= end
                    live_sessions_list.append({
                        "id": str(s.id),
                        "title": s.title,
                        "courseName": s.course_name,
                        "scheduledAt": s.scheduled_at.isoformat(),
                        "durationMinutes": s.duration_minutes,
                        "meetLink": s.meet_link,
                        "isLive": is_live,
                    })

            live_count = sum(1 for s in live_sessions_list if s["isLive"])

            # Quizzes for enrolled courses
            quizzes_list = []
            if course_ids_for_query:
                now = timezone.now()
                quizzes_qs = Quiz.objects.filter(course_id__in=course_ids_for_query, status="active").filter(
                    models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
                )
                for q in quizzes_qs:
                    start = q.start_date
                    end = q.end_date
                    is_live = (start and now >= start or not start) and (end and now <= end or not end)
                    is_scheduled = start and now < start
                    if end and now > end:
                        continue
                    quizzes_list.append({
                        "id": str(q.id),
                        "title": q.title,
                        "courseTitle": q.course_title if hasattr(q, 'course_title') else None,
                        "courseCode": q.course_code if hasattr(q, 'course_code') else None,
                        "startDate": start.isoformat() if start else None,
                        "endDate": end.isoformat() if end else None,
                        "isLive": is_live,
                        "isScheduled": is_scheduled,
                    })
                quizzes_list.sort(key=lambda x: x["startDate"] or "")

            # Results
            exam_results_qs = ExamResult.objects.filter(student_id=student_id).order_by("-academic_year", "-semester", "course_code")
            student_grades_qs = StudentGrade.objects.filter(student_id=student_id)

            term_map = {}
            for row in exam_results_qs:
                term_key = f"{row.academic_year} -- {row.semester}"
                if term_key not in term_map:
                    term_map[term_key] = {"term": term_key, "gpa": 0.0, "totalCredits": 0, "entries": []}
                credits = row.credits or 3
                grade_point = float(row.grade_point or 0)
                term_map[term_key]["entries"].append({
                    "id": str(row.id),
                    "course_id": row.course_id,
                    "courseTitle": row.course_title or "Course",
                    "courseCode": row.course_code or "",
                    "credits": credits,
                    "marks": row.marks or 0,
                    "grade": row.grade,
                    "grade_point": grade_point,
                    "academic_year": row.academic_year,
                    "semester": row.semester,
                })
                term_map[term_key]["totalCredits"] += credits
                term_map[term_key]["gpa"] += grade_point * credits

            for grade in student_grades_qs:
                term_key = f"{grade.academic_year} -- {grade.semester}"
                if term_key not in term_map:
                    term_map[term_key] = {"term": term_key, "gpa": 0.0, "totalCredits": 0, "entries": []}
                credits = 3
                gp = float(grade.gp or 0)
                term_map[term_key]["entries"].append({
                    "id": str(grade.id),
                    "course_id": grade.course_id,
                    "courseTitle": "Course",
                    "courseCode": "",
                    "credits": credits,
                    "marks": grade.total or 0,
                    "grade": grade.grade,
                    "grade_point": gp,
                    "academic_year": grade.academic_year,
                    "semester": grade.semester,
                })
                term_map[term_key]["totalCredits"] += credits
                term_map[term_key]["gpa"] += gp * credits

            terms = []
            for t in term_map.values():
                if t["totalCredits"]:
                    t["gpa"] = round(t["gpa"] / t["totalCredits"], 2)
                terms.append(t)

            total_credits = sum(t["totalCredits"] for t in terms)
            total_points = sum(t["gpa"] * t["totalCredits"] for t in terms)
            cgpa = round(total_points / total_credits, 2) if total_credits else 0.0

            return Response({
                "stats": {
                    "enrolled": enrolled_count,
                    "completed": completed_count,
                    "assignments": pending_assignments_count,
                    "liveMeets": live_count,
                },
                "results": {
                    "terms": terms,
                    "cgpa": cgpa,
                },
                "live_sessions": live_sessions_list,
                "quizzes": quizzes_list,
                "assignments": assignments_list,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class LiveSessionListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        course_ids = request.query_params.get("course_ids")
        qs = LiveSession.objects.all()
        if course_ids:
            ids = [c.strip() for c in course_ids.split(",") if c.strip()]
            qs = qs.filter(course_id__in=ids)
        qs = qs.order_by("scheduled_at")
        data = [
            {
                "id": str(s.id),
                "course_id": s.course_id,
                "title": s.title,
                "course_name": s.course_name,
                "scheduled_at": s.scheduled_at.isoformat(),
                "duration_minutes": s.duration_minutes,
                "meet_link": s.meet_link,
                "created_at": s.created_at.isoformat(),
            }
            for s in qs
        ]
        return Response(data)

    def post(self, request):
        course_id = request.data.get("course_id")
        title = request.data.get("title", "").strip()
        course_name = request.data.get("course_name", "").strip() or None
        scheduled_at = request.data.get("scheduled_at")
        duration_minutes = request.data.get("duration_minutes", 60)
        meet_link = request.data.get("meet_link")

        if not course_id or not title or not scheduled_at:
            return Response({"error": "course_id, title, scheduled_at required"}, status=400)

        session = LiveSession.objects.create(
            course_id=course_id,
            title=title,
            course_name=course_name,
            scheduled_at=scheduled_at,
            duration_minutes=int(duration_minutes),
            meet_link=meet_link,
        )
        return Response({
            "id": str(session.id),
            "course_id": session.course_id,
            "title": session.title,
            "course_name": session.course_name,
            "scheduled_at": session.scheduled_at.isoformat(),
            "duration_minutes": session.duration_minutes,
            "meet_link": session.meet_link,
        }, status=201)


class ClassroomListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        classrooms = Classroom.objects.all()
        data = [
            {
                "id": str(c.id),
                "name": c.name,
                "join_code": c.join_code,
                "instructor_id": c.instructor_id,
                "created_at": c.created_at.isoformat(),
            }
            for c in classrooms
        ]
        return Response(data)

    def post(self, request):
        name = request.data.get("name", "").strip()
        instructor_id = request.data.get("instructor_id")
        join_code = request.data.get("join_code", "").strip()

        if not name or not instructor_id:
            return Response({"error": "name and instructor_id required"}, status=400)

        if not join_code:
            import secrets
            join_code = secrets.token_hex(4).upper()

        classroom = Classroom.objects.create(
            name=name,
            join_code=join_code,
            instructor_id=instructor_id,
        )
        return Response({
            "id": str(classroom.id),
            "name": classroom.name,
            "join_code": classroom.join_code,
            "instructor_id": classroom.instructor_id,
            "created_at": classroom.created_at.isoformat(),
        }, status=201)


class ClassroomEnrollView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        classroom_id = request.data.get("classroom_id")
        student_id = request.data.get("student_id")
        role = request.data.get("role", "student")

        if not classroom_id or not student_id:
            return Response({"error": "classroom_id and student_id required"}, status=400)

        try:
            classroom = Classroom.objects.get(id=classroom_id)
        except Classroom.DoesNotExist:
            return Response({"error": "Classroom not found"}, status=404)

        enrollment, created = ClassroomEnrollment.objects.get_or_create(
            classroom=classroom,
            student_id=student_id,
            defaults={"role": role},
        )
        if not created:
            return Response({"error": "Already enrolled"}, status=409)

        return Response({
            "id": str(enrollment.id),
            "classroom_id": str(classroom.id),
            "classroom_name": classroom.name,
            "student_id": enrollment.student_id,
            "role": enrollment.role,
            "enrolled_at": enrollment.enrolled_at.isoformat(),
        }, status=201)


class ClassroomJoinView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        join_code = request.data.get("join_code", "").strip()
        student_id = request.data.get("student_id")

        if not join_code or not student_id:
            return Response({"error": "join_code and student_id required"}, status=400)

        try:
            classroom = Classroom.objects.get(join_code=join_code.upper())
        except Classroom.DoesNotExist:
            return Response({"error": "Invalid join code"}, status=404)

        enrollment, created = ClassroomEnrollment.objects.get_or_create(
            classroom=classroom,
            student_id=student_id,
            defaults={"role": "student"},
        )
        if not created:
            return Response({"error": "Already enrolled in this class"}, status=409)

        return Response({
            "id": str(enrollment.id),
            "classroom_id": str(classroom.id),
            "classroom_name": classroom.name,
            "student_id": enrollment.student_id,
            "enrolled_at": enrollment.enrolled_at.isoformat(),
        }, status=201)


class EnrollmentListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        student_id = request.query_params.get("student_id")
        course_ids_param = request.query_params.get("course_ids")
        qs = Enrollment.objects.all()
        if student_id:
            qs = qs.filter(student_id=student_id)
        if course_ids_param:
            ids = [c.strip() for c in course_ids_param.split(",") if c.strip()]
            qs = qs.filter(course_id__in=ids)

        course_unit_cache = {}
        course_cache = {}
        def resolve_course(course_id: str):
            if course_id in course_unit_cache:
                return course_unit_cache[course_id]
            if course_id in course_cache:
                return course_cache[course_id]
            try:
                unit = CourseUnit.objects.get(pk=course_id)
                course_unit_cache[course_id] = unit
                return unit
            except (CourseUnit.DoesNotExist, ValueError):
                pass
            try:
                course = Course.objects.get(pk=course_id)
                course_cache[course_id] = course
                return course
            except (Course.DoesNotExist, ValueError):
                pass
            return None

        def serialize_course(obj):
            if obj is None:
                return None
            if hasattr(obj, 'code') and hasattr(obj, 'name'):
                return {
                    "id": str(obj.id),
                    "code": obj.code,
                    "title": obj.name,
                    "credits": obj.credits if hasattr(obj, 'credits') else 3,
                    "semester": obj.semester if hasattr(obj, 'semester') else "",
                }
            return None

        data = []
        for e in qs:
            course_obj = resolve_course(str(e.course_id)) if e.course_id else None
            data.append({
                "id": str(e.id),
                "student_id": e.student_id,
                "course_id": e.course_id,
                "status": e.status,
                "grade": e.grade,
                "enrolled_at": e.enrolled_at.isoformat(),
                "course": serialize_course(course_obj),
            })
        return Response(data)


class SubmissionListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        student_id = request.query_params.get("student_id")
        assignment_ids = request.query_params.get("assignment_ids")
        qs = Submission.objects.all()
        if student_id:
            qs = qs.filter(student_id=student_id)
        if assignment_ids:
            ids = [a.strip() for a in assignment_ids.split(",") if a.strip()]
            qs = qs.filter(assignment_id__in=ids)
        data = [
            {
                "id": str(s.id),
                "assignment_id": s.assignment_id,
                "student_id": s.student_id,
                "status": s.status,
                "score": s.score,
                "feedback": s.feedback,
                "submitted_at": s.submitted_at.isoformat(),
            }
            for s in qs
        ]
        return Response(data)


class ScheduleListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = Schedule.objects.all()
        course_ids = request.query_params.get("course_ids")
        if course_ids:
            ids = [c.strip() for c in course_ids.split(",") if c.strip()]
            qs = qs.filter(course_id__in=ids)
        data = [
            {
                "id": str(s.id),
                "course_id": s.course_id,
                "day_of_week": s.day_of_week,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "room": s.room,
                "building": s.building,
            }
            for s in qs
        ]
        return Response(data)


class StudentFeeListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        student_id = request.query_params.get("student_id")
        qs = StudentFee.objects.all()
        if student_id:
            qs = qs.filter(student_id=student_id)
        data = [
            {
                "id": str(f.id),
                "amount": f.amount,
                "paid_amount": f.paid_amount,
                "due_date": f.due_date.isoformat(),
                "semester": f.semester,
                "academic_year": f.academic_year,
                "description": f.description,
            }
            for f in qs
        ]
        return Response(data)


class ActivityListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = Activity.objects.all()
        limit = request.query_params.get("limit")
        if limit:
            try:
                qs = qs[:int(limit)]
            except (ValueError, TypeError):
                pass
        serializer = ActivitySerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ActivitySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        activity = Activity.objects.create(**serializer.validated_data)
        return Response(ActivitySerializer(activity).data, status=201)


class SignUpListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = SignUp.objects.all()
        lecturer_id = request.query_params.get("lecturer_id")
        if lecturer_id:
            qs = qs.filter(lecturer_id=lecturer_id)
        course_unit_id = request.query_params.get("course_unit_id")
        if course_unit_id:
            qs = qs.filter(course_unit_id=course_unit_id)
        serializer = SignUpSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        signup = SignUp.objects.create(**serializer.validated_data)
        return Response(SignUpSerializer(signup).data, status=201)

    def delete(self, request):
        signup_id = request.query_params.get("id")
        lecturer_id = request.query_params.get("lecturer_id")
        course_unit_id = request.query_params.get("course_unit_id")
        if signup_id:
            try:
                signup = SignUp.objects.get(pk=signup_id)
            except SignUp.DoesNotExist:
                return Response({"error": "SignUp not found"}, status=404)
            signup.delete()
            return Response(status=204)
        if lecturer_id and course_unit_id:
            deleted, _ = SignUp.objects.filter(lecturer_id=lecturer_id, course_unit_id=course_unit_id).delete()
            return Response(status=204)
        return Response({"error": "Provide id or lecturer_id + course_unit_id"}, status=400)

    def put(self, request):
        data = request.data
        lecturer_id = data.get("lecturer_id")
        course_unit_id = data.get("course_unit_id")
        if not lecturer_id or not course_unit_id:
            return Response({"error": "lecturer_id and course_unit_id required"}, status=400)
        existing = SignUp.objects.filter(lecturer_id=lecturer_id, course_unit_id=course_unit_id).first()
        if existing:
            for attr, value in data.items():
                setattr(existing, attr, value)
            existing.save()
            return Response(SignUpSerializer(existing).data)
        serializer = SignUpSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        signup = SignUp.objects.create(**serializer.validated_data)
        return Response(SignUpSerializer(signup).data, status=201)
