from django import forms
from django.contrib import admin
from .models import Subject, Exam, Question, StudentAttempt
from .math_widget import MathSymbolWidget


class QuestionAdminForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = "__all__"
        widgets = {
            "text": MathSymbolWidget(attrs={"rows": 4, "cols": 80}),
            "option_a": MathSymbolWidget(attrs={"rows": 1, "cols": 80}),
            "option_b": MathSymbolWidget(attrs={"rows": 1, "cols": 80}),
            "option_c": MathSymbolWidget(attrs={"rows": 1, "cols": 80}),
            "option_d": MathSymbolWidget(attrs={"rows": 1, "cols": 80}),
        }


class QuestionAdmin(admin.ModelAdmin):
    form = QuestionAdminForm


admin.site.register(Subject)
admin.site.register(Exam)
admin.site.register(Question, QuestionAdmin)
admin.site.register(StudentAttempt)