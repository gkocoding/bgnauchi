from django.db.models import Count, Prefetch
from rest_framework import viewsets, generics, permissions, status
from .models import Subject, Exam, Question, StudentAttempt
from .serializers import (
    SubjectSerializer,
    ExamSerializer,
    ExamListSerializer,
    StudentAttemptSerializer,
    RegisterSerializer,
    UserSerializer,
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .throttles import RegisterThrottle, CheckThrottle


# Предметите и тестовете са САМО за четене през публичното API.
# Създаването/редакцията/изтриването става през Django admin (/admin/).
class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all().order_by('id')
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class ExamViewSet(viewsets.ReadOnlyModelViewSet):
    # Нужен е на router-а за име на маршрутите; реалният queryset е в get_queryset().
    queryset = Exam.objects.all()

    def get_queryset(self):
        queryset = Exam.objects.select_related('subject').order_by('id')

        if self.action == 'list':
            # Списъкът не връща въпросите, само броя им - много по-леко.
            queryset = queryset.annotate(question_count=Count('questions'))
        else:
            queryset = queryset.prefetch_related(
                Prefetch('questions', queryset=Question.objects.order_by('id'))
            )

        grade = self.request.query_params.get('grade')
        subject = self.request.query_params.get('subject')
        # isdigit() предпазва от 500 грешка при ?grade=abc
        if grade:
            queryset = queryset.filter(grade=grade) if grade.isdigit() else queryset.none()
        if subject:
            queryset = queryset.filter(subject__id=subject) if subject.isdigit() else queryset.none()
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamListSerializer
        return ExamSerializer

    def get_permissions(self):
        # "check" изисква логнат потребител - тестовете не могат
        # да се решават анонимно, за да има смисъл записването на резултат.
        if self.action == 'check':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'], throttle_classes=[CheckThrottle])
    def check(self, request, pk=None):
        exam = self.get_object()
        answers = request.data.get('answers', {})
        if not isinstance(answers, dict):
            return Response(
                {'detail': "'answers' трябва да е обект {id_на_въпрос: буква}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions = list(exam.questions.all())
        total = len(questions)
        score = 0
        correct_answers = {}

        for question in questions:
            correct_answers[str(question.id)] = question.correct_option
            submitted = answers.get(str(question.id))
            if submitted == question.correct_option:
                score += 1

        StudentAttempt.objects.create(
            user=request.user,
            exam=exam,
            score=score,
            total_questions=total,
        )

        return Response({
            'score': score,
            'total': total,
            'correct_answers': correct_answers,
        })


class RegisterView(generics.CreateAPIView):
    queryset = None
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterThrottle]

    def get_queryset(self):
        from django.contrib.auth.models import User
        return User.objects.all()


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class MyAttemptsView(generics.ListAPIView):
    serializer_class = StudentAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentAttempt.objects.filter(user=self.request.user).select_related('exam')
