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
        fields = [
            'id', 'text', 'image',
            'option_a', 'option_b', 'option_c', 'option_d',
            'topic', 'points'
        ]


class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    subject = SubjectSerializer(read_only=True)
    exam_label = serializers.CharField(read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'grade', 'exam_type', 'exam_label', 'duration_minutes', 'subject', 'questions']


class ExamListSerializer(serializers.ModelSerializer):
    """Лек вариант за списъци: без въпроси, само брой."""
    subject = SubjectSerializer(read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    exam_label = serializers.CharField(read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'grade', 'exam_type', 'exam_label', 'duration_minutes', 'subject', 'question_count']


class StudentAttemptSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_grade = serializers.IntegerField(source='exam.grade', read_only=True)
    mon_grade = serializers.FloatField(read_only=True)

    class Meta:
        model = StudentAttempt
        fields = [
            'id', 'user', 'exam', 'exam_title', 'exam_grade',
            'score', 'total_questions', 'earned_points', 'max_points',
            'mon_grade', 'duration_seconds', 'tab_switches', 'completed_at'
        ]
        read_only_fields = ['user', 'completed_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    email = serializers.EmailField(required=True)
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'website']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Вече има регистриран потребител с този имейл.")
        return value

    def validate_website(self, value):
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


# В serializers.py замени UserSerializer с този код:
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'school_name', 'city']

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile:
            return profile.role
        if obj.is_staff or obj.is_superuser:
            return 'teacher'
        return 'student'

    def get_school_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.school_name if profile else ""

    def get_city(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.city if profile else ""