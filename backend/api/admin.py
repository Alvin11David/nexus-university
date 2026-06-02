from django.contrib import admin

from .models import OtpVerification, StudentRecord


@admin.register(StudentRecord)
class StudentRecordAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "registration_number",
        "student_number",
        "email",
        "is_registered",
        "created_at",
    )
    search_fields = ("full_name", "registration_number", "student_number", "email")
    list_filter = ("is_registered",)


@admin.register(OtpVerification)
class OtpVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "purpose",
        "verified",
        "attempts",
        "max_attempts",
        "created_at",
        "expires_at",
    )
    search_fields = ("email",)
    list_filter = ("purpose", "verified")
