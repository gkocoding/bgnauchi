from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SubjectViewSet,
    ExamViewSet,
    RegisterView,
    MeView,
    MyAttemptsView,
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
] + router.urls