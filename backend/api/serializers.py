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
