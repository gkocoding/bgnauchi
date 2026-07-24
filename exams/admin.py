from django.contrib import admin
from .models import Subject, Exam, Question, StudentAttempt

admin.site.register(Subject)
admin.site.register(Exam)
admin.site.register(Question)
admin.site.register(StudentAttempt)