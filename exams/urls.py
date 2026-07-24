from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, ExamViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet)
router.register(r'exams', ExamViewSet)

urlpatterns = router.urls