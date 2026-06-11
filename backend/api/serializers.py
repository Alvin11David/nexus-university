from rest_framework import serializers


class ValidateStudentRecordSerializer(serializers.Serializer):
    registrationNumber = serializers.CharField(max_length=64)
    studentNumber = serializers.CharField(max_length=64)
    email = serializers.EmailField()


class SendSignupOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    studentRecordId = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class VerifySignupOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=8)


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    fullName = serializers.CharField(max_length=255)
    registrationNumber = serializers.CharField(max_length=64, required=False, allow_blank=True)
    studentNumber = serializers.CharField(max_length=64, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=["student", "lecturer", "admin", "registrar"],
        default="student",
        required=False,
    )
    department = serializers.CharField(max_length=255, required=False, allow_blank=True)
    college = serializers.CharField(max_length=255, required=False, allow_blank=True)
    programme = serializers.CharField(max_length=255, required=False, allow_blank=True)


class PasswordResetSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    newPassword = serializers.CharField(write_only=True)


class StudentRecordSerializer(serializers.Serializer):
    id = serializers.CharField()
    full_name = serializers.CharField()
    registration_number = serializers.CharField()
    student_number = serializers.CharField()
    email = serializers.EmailField()
    is_registered = serializers.BooleanField()


class ProgramSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    code = serializers.CharField(allow_blank=True)
    description = serializers.CharField(allow_blank=True)
    department_name = serializers.CharField(allow_null=True, allow_blank=True)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()


class AcademicEventSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    date = serializers.DateTimeField()
    dueDate = serializers.DateTimeField(allow_null=True, required=False)
    type = serializers.CharField(allow_blank=True)
    isActive = serializers.BooleanField()


class AnnouncementSerializer(serializers.Serializer):
    id = serializers.CharField()
    course_id = serializers.CharField(allow_null=True)
    author_id = serializers.CharField(allow_null=True)
    title = serializers.CharField()
    content = serializers.CharField()
    created_at = serializers.DateTimeField()


class CourseSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    code = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=255)
    college = serializers.CharField(max_length=255)
    department = serializers.CharField(max_length=255)
    duration_years = serializers.IntegerField()
    fee_structure = serializers.JSONField(default=list)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class CourseUnitSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    code = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=255)
    course_id = serializers.CharField()
    semester = serializers.IntegerField()
    year = serializers.IntegerField()
    credits = serializers.IntegerField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ProfileSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    role = serializers.ChoiceField(choices=["student", "lecturer"])
    full_name = serializers.CharField(allow_blank=True, default="")
    email = serializers.CharField(allow_blank=True, default="")
    department = serializers.CharField(allow_blank=True, default="")
    college = serializers.CharField(allow_blank=True, default="")
    avatar_url = serializers.CharField(allow_blank=True, default="")
    is_registered = serializers.BooleanField(default=False)
    student_number = serializers.CharField(allow_blank=True, default="")
    registration_number = serializers.CharField(allow_blank=True, default="")
    program = serializers.CharField(allow_blank=True, default="")
    year_of_study = serializers.IntegerField(default=1)
    status = serializers.CharField(allow_blank=True, default="Active")
    admission_date = serializers.CharField(allow_blank=True, default="")
    lecturer_number = serializers.CharField(allow_blank=True, default="")
    phone = serializers.CharField(allow_blank=True, default="")
    address = serializers.CharField(allow_blank=True, default="")
    bio = serializers.CharField(allow_blank=True, default="")
    specialization = serializers.CharField(allow_blank=True, default="")
    employment_date = serializers.CharField(allow_blank=True, default="")
    assigned_course_units = serializers.JSONField(default=list)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class RegistrarSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField()
    email = serializers.EmailField(allow_blank=True, default="")
    first_name = serializers.CharField(allow_blank=True, default="")
    last_name = serializers.CharField(allow_blank=True, default="")
    employee_id = serializers.CharField(allow_blank=True, default="")
    department = serializers.CharField(allow_blank=True, default="")
    college = serializers.CharField(allow_blank=True, default="")
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class FeeAssignmentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    item_name = serializers.CharField()
    category = serializers.CharField(allow_blank=True, default="")
    year_level = serializers.IntegerField(default=1)
    semester = serializers.IntegerField(default=1)
    academic_year = serializers.CharField()
    amount = serializers.FloatField(default=0)
    currency = serializers.CharField(allow_blank=True, default="UGX")
    college = serializers.CharField(allow_blank=True, default="")
    notes = serializers.CharField(allow_blank=True, default="")
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class StudentGradeSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    student_id = serializers.CharField()
    course_id = serializers.CharField(allow_blank=True, default="")
    academic_year = serializers.CharField()
    semester = serializers.CharField()
    total = serializers.FloatField(default=0)
    grade = serializers.CharField(allow_blank=True, default="")
    gp = serializers.FloatField(default=0)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ActivitySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    action = serializers.CharField()
    entity = serializers.CharField(allow_blank=True, default="")
    entity_id = serializers.CharField(allow_blank=True, default="")
    entity_name = serializers.CharField(allow_blank=True, default="")
    details = serializers.CharField(allow_blank=True, default="")
    timestamp = serializers.DateTimeField(read_only=True)
    user_id = serializers.CharField(allow_blank=True, default="")
    user_name = serializers.CharField(allow_blank=True, default="")


class SignUpSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    lecturer_id = serializers.CharField()
    lecturer_name = serializers.CharField(allow_blank=True, default="")
    lecturer_email = serializers.CharField(allow_blank=True, default="")
    course_unit_id = serializers.CharField()
    course_unit_code = serializers.CharField(allow_blank=True, default="")
    course_unit_name = serializers.CharField(allow_blank=True, default="")
    course_id = serializers.CharField(allow_blank=True, default="")
    assigned_by = serializers.CharField(allow_blank=True, default="")
    assigned_at = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(allow_blank=True, default="active")


class AssignmentSerializer(serializers.Serializer):
    id = serializers.CharField()
    course_id = serializers.CharField(allow_null=True)
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    due_date = serializers.DateTimeField()
    total_points = serializers.IntegerField()
    instruction_document_url = serializers.CharField(allow_null=True, allow_blank=True)
    instruction_document_name = serializers.CharField(allow_null=True, allow_blank=True)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
