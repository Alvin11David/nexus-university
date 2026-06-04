from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction, models
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OtpVerification, StudentRecord
from .serializers import (
    SendSignupOtpSerializer,
    StudentRecordSerializer,
    ValidateStudentRecordSerializer,
    VerifySignupOtpSerializer,
)

from .serializers import ProgramSerializer, AcademicEventSerializer
from .models import Program, AcademicEvent
from .serializers import AnnouncementSerializer
from .models import Announcement
from .serializers import AssignmentSerializer
from .models import Assignment, Quiz, QuizQuestion, QuizAttempt, ExamResult


OTP_TTL_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_PER_HOUR = 5
OTP_MAX_ATTEMPTS = 5


def normalize_email(value: str) -> str:
    return value.strip().lower()


def validate_email_format(email: str) -> None:
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ValueError("A valid email address is required.")


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
        announcements = Announcement.objects.all()
        data = [
            {
                "id": str(a.id),
                "course_id": a.course_id,
                "author_id": a.author_id,
                "title": a.title,
                "content": a.content,
                "created_at": a.created_at,
            }
            for a in announcements
        ]
        return Response(data)


class AssignmentListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        # Optional filter: ?course_ids=cid1,cid2
        course_ids = request.query_params.get("course_ids")
        qs = Assignment.objects.all()
        if course_ids:
            ids = [c.strip() for c in course_ids.split(",") if c.strip()]
            qs = qs.filter(course_id__in=ids)

        data = [
            {
                "id": str(a.id),
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


class QuizListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        from datetime import datetime
        from django.utils import timezone

        # Filter active quizzes that haven't ended
        now = timezone.now()
        qs = Quiz.objects.filter(status="active").filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
        )
        qs = qs.order_by("-created_at")

        data = [
            {
                "id": str(q.id),
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
