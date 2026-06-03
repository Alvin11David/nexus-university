from django.urls import path

from .views import (
    HealthView,
    SendSignupOtpView,
    ValidateStudentRecordView,
    VerifySignupOtpView,
    ProgramListView,
    AcademicCalendarView,
)

urlpatterns = [
    path("health/", HealthView.as_view()),
    path("auth/validate-student-record/", ValidateStudentRecordView.as_view()),
    path("auth/send-signup-otp/", SendSignupOtpView.as_view()),
    path("auth/verify-signup-otp/", VerifySignupOtpView.as_view()),
    path("programs/", ProgramListView.as_view()),
    path("academic-calendar/", AcademicCalendarView.as_view()),
]
