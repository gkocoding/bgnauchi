from django.db import models
from django.contrib.auth.models import User


class Subject(models.Model):
    name = models.CharField(max_length=100)  # напр. Математика, БЕЛ

    def __str__(self):
        return self.name


class Exam(models.Model):
    EXAM_TYPES = [
        ('matura', 'Матура'),
        ('kandidatstudentski', 'Кандидатстудентски'),
    ]
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    grade = models.IntegerField()  # 5, 7, 10, 12
    title = models.CharField(max_length=255)
    exam_type = models.CharField(max_length=30, choices=EXAM_TYPES)

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

    def __str__(self):
        return self.text[:50]


class StudentAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(null=True, blank=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.username} - {self.exam.title} - {self.score}"