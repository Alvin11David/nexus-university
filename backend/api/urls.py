from django.urls import path

from .views import (
    HealthView,
    SendSignupOtpView,
    ValidateStudentRecordView,
    VerifySignupOtpView,
    ProgramListView,
    AcademicCalendarView,
    AnnouncementListView,
    AssignmentListView,
    QuizListView,
    QuizDetailView,
    QuizSubmitView,
)

urlpatterns = [
    path("health/", HealthView.as_view()),
    path("auth/validate-student-record/", ValidateStudentRecordView.as_view()),
    path("auth/send-signup-otp/", SendSignupOtpView.as_view()),
    path("auth/verify-signup-otp/", VerifySignupOtpView.as_view()),
    path("programs/", ProgramListView.as_view()),
    path("academic-calendar/", AcademicCalendarView.as_view()),
    path("announcements/", AnnouncementListView.as_view()),
    path("assignments/", AssignmentListView.as_view()),
    path("quizzes/", QuizListView.as_view()),
    path("quizzes/<int:quiz_id>/", QuizDetailView.as_view()),
    path("quizzes/submit/", QuizSubmitView.as_view()),
]
