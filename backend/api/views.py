from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
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
