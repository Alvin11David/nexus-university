from django.db import models


class StudentRecord(models.Model):
    registration_number = models.CharField(max_length=64)
    student_number = models.CharField(max_length=64)
    email = models.EmailField()
    full_name = models.CharField(max_length=255)
    is_registered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["registration_number", "student_number"],
                name="unique_student_record_identity",
            )
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.student_number})"


class OtpVerification(models.Model):
    PURPOSE_SIGNUP = "signup"
    PURPOSE_CHOICES = [(PURPOSE_SIGNUP, "Signup")]

    student_record = models.ForeignKey(
        StudentRecord,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="otp_verifications",
    )
    email = models.EmailField()
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES)
    otp_hash = models.CharField(max_length=64)
    nonce = models.CharField(max_length=64)
    verified = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"OTP<{self.email}:{self.purpose}>"


class Program(models.Model):
    title = models.CharField(max_length=255)
    code = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    department_name = models.CharField(max_length=128, blank=True, null=True)
    status = models.CharField(
        max_length=32,
        choices=[
            ("running", "Running"),
            ("closed", "Closed"),
            ("archived", "Archived"),
        ],
        default="running",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.code})"


class AcademicEvent(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    date = models.DateTimeField()
    due_date = models.DateTimeField(null=True, blank=True)
    type = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"{self.title} ({self.date.date()})"


class Announcement(models.Model):
    course_id = models.CharField(max_length=64, blank=True, null=True)
    author_id = models.CharField(max_length=64, blank=True, null=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.created_at.date()})"


class Assignment(models.Model):
    course_id = models.CharField(max_length=64, blank=True, null=True)
    course_title = models.CharField(max_length=255, blank=True, null=True)
    course_code = models.CharField(max_length=64, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField()
    total_points = models.IntegerField(default=100)
    instruction_document_url = models.CharField(max_length=1024, blank=True, null=True)
    instruction_document_name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=32,
        choices=[("pending", "Pending"), ("submitted", "Submitted"), ("graded", "Graded")],
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.course_id})"
