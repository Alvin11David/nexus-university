from django.db import models


class StudentRecord(models.Model):
    registration_number = models.CharField(max_length=64)
    student_number = models.CharField(max_length=64)
    email = models.EmailField()
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    programme = models.CharField(max_length=255, blank=True, null=True)
    college = models.CharField(max_length=255, blank=True, null=True)
    year = models.CharField(max_length=32, blank=True, null=True)
    blood_type = models.CharField(max_length=5, blank=True, null=True)
    id_card_valid_thru = models.CharField(max_length=32, blank=True, null=True)
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


class Quiz(models.Model):
    course_id = models.CharField(max_length=64, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(default=30)
    max_attempts = models.PositiveIntegerField(default=1)
    passing_score = models.PositiveIntegerField(default=60)
    show_answers = models.BooleanField(default=True)
    status = models.CharField(
        max_length=32,
        choices=[("draft", "Draft"), ("active", "Active"), ("closed", "Closed")],
        default="draft",
    )
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.status})"


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    question = models.TextField()
    options = models.JSONField(default=list)
    correct_answer = models.PositiveIntegerField()
    points = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.quiz.title} - Q{self.id}"


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student_id = models.CharField(max_length=255)
    answers = models.JSONField(default=dict)
    score = models.PositiveIntegerField()
    total_points = models.PositiveIntegerField()
    time_taken = models.PositiveIntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]

    def __str__(self) -> str:
        return f"{self.quiz.title} - Student {self.student_id}"


class ExamResult(models.Model):
    student_id = models.CharField(max_length=255)
    course_id = models.CharField(max_length=64)
    course_title = models.CharField(max_length=255, blank=True)
    course_code = models.CharField(max_length=64, blank=True)
    credits = models.PositiveIntegerField(default=3)
    academic_year = models.CharField(max_length=32)
    semester = models.CharField(max_length=32)
    assignment1 = models.PositiveIntegerField(default=0)
    assignment2 = models.PositiveIntegerField(default=0)
    midterm = models.PositiveIntegerField(default=0)
    participation = models.PositiveIntegerField(default=0)
    final_exam = models.PositiveIntegerField(default=0)
    marks = models.PositiveIntegerField(default=0)
    grade = models.CharField(max_length=2, blank=True, null=True)
    grade_point = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    remark = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-academic_year", "-semester", "course_code"]

    def __str__(self) -> str:
        return f"{self.student_id} - {self.course_code} ({self.academic_year})"


class Message(models.Model):
    from_user_id = models.CharField(max_length=255)
    to_user_id = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_deleted_by_sender = models.BooleanField(default=False)
    is_deleted_by_recipient = models.BooleanField(default=False)
    attachment_url = models.CharField(max_length=512, blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True, null=True)
    attachment_size = models.PositiveIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.subject} ({self.from_user_id} to {self.to_user_id})"


class MessageDraft(models.Model):
    user_id = models.CharField(max_length=255)
    to_user_id = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Draft - {self.subject or '(no subject)'} by {self.user_id}"


class UserSettings(models.Model):
    user_id = models.CharField(max_length=255, unique=True)
    theme = models.CharField(max_length=32, default="system", choices=[("light", "Light"), ("dark", "Dark"), ("system", "System")])
    notifications_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    privacy_level = models.CharField(max_length=32, default="private", choices=[("public", "Public"), ("friends", "Friends Only"), ("private", "Private")])
    language = models.CharField(max_length=32, default="en", choices=[("en", "English"), ("sw", "Swahili")])
    two_factor_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Settings for {self.user_id}"
