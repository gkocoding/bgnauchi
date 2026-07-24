from rest_framework import viewsets
from .models import Subject, Exam, Question
from .serializers import SubjectSerializer, ExamSerializer, QuestionSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

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

        return Response({
            'score': score,
            'total': total,
            'correct_answers': correct_answers,
        })