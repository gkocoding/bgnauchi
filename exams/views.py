from rest_framework import viewsets, generics, permissions
from .models import Subject, Exam, Question, StudentAttempt
from .serializers import (
    SubjectSerializer,
    ExamSerializer,
    QuestionSerializer,
    StudentAttemptSerializer,
    RegisterSerializer,
    UserSerializer,
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .throttles import RegisterThrottle


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer

    def get_queryset(self):
        queryset = Exam.objects.all()
        grade = self.request.query_params.get('grade')
        subject = self.request.query_params.get('subject')
        if grade:
            queryset = queryset.filter(grade=grade)
        if subject:
            queryset = queryset.filter(subject__id=subject)
        return queryset

    def get_permissions(self):
        # "check" изисква логнат потребител - тестовете вече не могат
        # да се решават анонимно, за да има смисъл записването на резултат.
        if self.action == 'check':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'])
    def check(self, request, pk=None):
        exam = self.get_object()
        answers = request.data.get('answers', {})

        questions = exam.questions.all()
        total = questions.count()
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
        return StudentAttempt.objects.filter(user=self.request.user)