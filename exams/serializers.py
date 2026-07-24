from rest_framework import serializers
from .models import Subject, Exam, Question, StudentAttempt

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d']
        # забележи: НЕ включваме 'correct_option' тук - не искаме ученикът да го вижда в браузъра!

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'grade', 'exam_type', 'subject', 'questions']

class StudentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAttempt
        fields = '__all__'