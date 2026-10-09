from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Subject, Exam, Question, StudentAttempt


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'image', 'option_a', 'option_b', 'option_c', 'option_d']


class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'grade', 'exam_type', 'subject', 'questions']


class ExamListSerializer(serializers.ModelSerializer):
    """Лек вариант за списъци: без въпроси, само брой."""
    subject = SubjectSerializer(read_only=True)
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'grade', 'exam_type', 'subject', 'question_count']


class StudentAttemptSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = StudentAttempt
        fields = ['id', 'user', 'exam', 'exam_title', 'score', 'total_questions', 'completed_at']
        read_only_fields = ['user', 'completed_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    email = serializers.EmailField(required=True)
    # Honeypot поле - невидимо за истински хора, ботовете често го попълват автоматично.
    # Не се записва никъде, само проверяваме дали е празно.
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'website']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Вече има регистриран потребител с този имейл.")
        return value

    def validate_website(self, value):
        # Ако honeypot полето е попълнено - това е бот, отхвърляме заявката.
        if value:
            raise serializers.ValidationError("Невалидна заявка.")
        return value

    def create(self, validated_data):
        validated_data.pop('website', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']