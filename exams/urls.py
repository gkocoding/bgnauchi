from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SubjectViewSet,
    ExamViewSet,
    RegisterView,
    MeView,
    MyAttemptsView,
    ProfileAnalyticsView,
    MistakeRepairExamView,
    LeaderboardView,
    DailyChallengeView,
    DuelView,
    TeacherDashboardView,
    HomeworkPlayView,
)
from .auth_views import CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet)
router.register(r'exams', ExamViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('attempts/', MyAttemptsView.as_view(), name='my-attempts'),
    path('analytics/', ProfileAnalyticsView.as_view(), name='profile-analytics'),
    path('mistakes-exam/', MistakeRepairExamView.as_view(), name='mistakes-exam'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('daily-challenge/', DailyChallengeView.as_view(), name='daily-challenge'),
    path('duels/', DuelView.as_view(), name='duel-create'),
    path('duels/<str:code>/', DuelView.as_view(), name='duel-detail'),
    path('teacher/dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),
    path('homework/<str:code>/', HomeworkPlayView.as_view(), name='homework-play'),
] + router.urls