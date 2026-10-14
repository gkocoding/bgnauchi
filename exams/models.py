from django.db import models
from django.contrib.auth.models import User


class Subject(models.Model):
    name = models.CharField(max_length=100)  # напр. Математика, БЕЛ

    def __str__(self):
        return self.name


class Exam(models.Model):
    EXAM_TYPES = [
        ('nvo', 'НВО (Национално външно оценяване)'),
        ('matura', 'Матура (ДЗИ)'),
        ('kandidatstudentski', 'Кандидатстудентски'),
    ]
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    grade = models.IntegerField()  # 4, 7, 10, 12
    title = models.CharField(max_length=255)
    exam_type = models.CharField(max_length=30, choices=EXAM_TYPES, default='nvo')
    duration_minutes = models.PositiveIntegerField(default=75, help_text="Време за решаване в минути")

    @property
    def exam_label(self):
        if self.grade in [4, 7, 10] and self.exam_type in ['nvo', 'matura']:
            return f"НВО — {self.grade}. клас"
        if self.grade == 12 and self.exam_type == 'matura':
            return "ДЗИ (Матура) — 12. клас"
        return f"{self.get_exam_type_display()} — {self.grade}. клас"

    def __str__(self):
        return f"{self.title} ({self.grade} клас)"


class Question(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    image = models.ImageField(upload_to='', blank=True, null=True)
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_option = models.CharField(max_length=1, choices=[('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')])

    # Нови полета за аналитика, точки по МОН и обяснения стъпка по стъпка
    topic = models.CharField(max_length=120, blank=True, default="Общи задачи",
                             help_text="Напр. Алгебра, Геометрия, Пунктуация")
    points = models.FloatField(default=1.0, help_text="Точки по скалата на МОН за този въпрос")
    explanation = models.TextField(blank=True, default="", help_text="Решение стъпка по стъпка (поддържа LaTeX)")

    def __str__(self):
        return self.text[:50]


class StudentAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(null=True, blank=True)
    earned_points = models.FloatField(default=0.0)
    max_points = models.FloatField(default=0.0)
    duration_seconds = models.PositiveIntegerField(default=0)
    tab_switches = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    @property
    def mon_grade(self):
        """Приравняване към оценка по шестобалната система (2.00 - 6.00)"""
        total_p = self.max_points if self.max_points > 0 else (self.total_questions or 0)
        earned_p = self.earned_points if self.max_points > 0 else (self.score or 0)
        if total_p == 0:
            return 2.00
        pct = (earned_p / total_p) * 100
        if pct < 23:
            return 2.00
        elif pct < 41:
            return round(2.50 + ((pct - 23) / 18) * 0.99, 2)
        elif pct < 59:
            return round(3.50 + ((pct - 41) / 18) * 0.99, 2)
        elif pct < 77:
            return round(4.50 + ((pct - 59) / 18) * 0.99, 2)
        else:
            return min(6.00, round(5.50 + ((pct - 77) / 23) * 0.50, 2))

    def __str__(self):
        return f"{self.user.username} - {self.exam.title} - {self.score}"


class QuestionResponse(models.Model):
    """Пази отговорите по въпроси за 'Поправи грешките си' и статистика по теми"""
    attempt = models.ForeignKey(StudentAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='user_responses')
    selected_option = models.CharField(max_length=1, blank=True, null=True)
    is_correct = models.BooleanField(default=False)


import uuid
import random
import string


def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class UserProfile(models.Model):
    """Разширен профил за роля (Ученик/Учител), училище, град и точки за класацията"""
    ROLE_CHOICES = [
        ('student', 'Ученик'),
        ('teacher', 'Учител'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='student')
    school_name = models.CharField(max_length=150, blank=True, default="", help_text="Напр. СМГ, НПМГ, 1. СУ")
    city = models.CharField(max_length=100, blank=True, default="", help_text="Напр. София, Пловдив, Варна")
    xp = models.PositiveIntegerField(default=0, help_text="Общо натрупани точки за класацията")

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class TeacherAssignment(models.Model):
    """Домашно задание / тест, генериран от учител за неговия клас"""
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=8, unique=True, default=generate_code)
    grade = models.IntegerField(default=7)
    questions = models.ManyToManyField(Question, related_name='assignments')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} [{self.code}]"


class AssignmentSubmission(models.Model):
    """Резултат на ученик по задание от учител"""
    assignment = models.ForeignKey(TeacherAssignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')
    score = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assignment', 'student')


class DuelMatch(models.Model):
    """1v1 Дуел между двама приятели с уникален линк"""
    code = models.CharField(max_length=8, unique=True, default=generate_code)
    grade = models.IntegerField(default=7)
    questions = models.ManyToManyField(Question, related_name='duels')

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_duels')
    creator_score = models.IntegerField(null=True, blank=True)
    creator_time = models.PositiveIntegerField(default=0, help_text="Време в секунди")

    opponent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='joined_duels')
    opponent_score = models.IntegerField(null=True, blank=True)
    opponent_time = models.PositiveIntegerField(default=0, help_text="Време в секунди")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Дуел {self.code} ({self.grade}. клас)"