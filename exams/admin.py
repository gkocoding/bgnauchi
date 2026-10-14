from django import forms
from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import (
    Subject,
    Exam,
    Question,
    StudentAttempt,
    QuestionResponse,
    UserProfile,
    TeacherAssignment,
    AssignmentSubmission,
    DuelMatch,
)
from .math_widget import MathSymbolWidget
from .forms import PDFImportForm
from .pdf_import import import_exam_from_pdf


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
            "explanation": MathSymbolWidget(attrs={"rows": 3, "cols": 80}),
        }


class QuestionAdmin(admin.ModelAdmin):
    form = QuestionAdminForm
    list_display = ("short_text", "exam", "topic", "points", "correct_option")
    list_filter = ("exam__grade", "exam__subject", "topic", "exam")
    search_fields = ("text", "topic", "explanation")
    list_editable = ("topic", "points", "correct_option")

    def short_text(self, obj):
        return obj.text[:60]
    short_text.short_description = "Въпрос"


class StudentAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "exam", "score", "total_questions", "earned_points", "tab_switches", "completed_at")
    list_filter = ("exam", "exam__grade", "completed_at")
    search_fields = ("user__username", "exam__title")
    readonly_fields = ("completed_at",)
    ordering = ("-completed_at",)


class ExamAdmin(admin.ModelAdmin):
    list_display = ("title", "grade", "subject", "exam_type", "duration_minutes")
    list_filter = ("grade", "subject", "exam_type")
    change_list_template = "admin/exams/exam/change_list_with_import.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("import-pdf/", self.admin_site.admin_view(self.import_pdf_view), name="exams_exam_import_pdf"),
        ]
        return custom_urls + urls

    def import_pdf_view(self, request):
        if request.method == "POST":
            form = PDFImportForm(request.POST, request.FILES)
            if form.is_valid():
                exam = Exam.objects.create(
                    title=form.cleaned_data["title"],
                    grade=form.cleaned_data["grade"],
                    subject=form.cleaned_data["subject"],
                    exam_type=form.cleaned_data["exam_type"],
                )
                try:
                    count = import_exam_from_pdf(form.cleaned_data["pdf_file"], exam)
                    messages.success(
                        request,
                        f"Готово! Създадени са {count} въпроса към теста '{exam.title}'. "
                        f"ВАЖНО: провери верните отговори и добави снимки ръчно, ако има такива.",
                    )
                    return redirect(f"/admin/exams/question/?exam__id__exact={exam.id}")
                except ValueError as e:
                    exam.delete()
                    messages.error(request, str(e))
        else:
            form = PDFImportForm()

        return render(request, "admin/exams/exam/import_pdf.html", {"form": form, "opts": self.model._meta})


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "school_name", "city", "xp")
    list_filter = ("role", "city")
    search_fields = ("user__username", "school_name", "city")


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "code", "teacher", "grade", "created_at")
    search_fields = ("title", "code", "teacher__username")


@admin.register(DuelMatch)
class DuelMatchAdmin(admin.ModelAdmin):
    list_display = ("code", "grade", "creator", "creator_score", "opponent", "opponent_score", "created_at")


admin.site.register(Subject)
admin.site.register(Exam, ExamAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(StudentAttempt, StudentAttemptAdmin)
admin.site.register(QuestionResponse)
admin.site.register(AssignmentSubmission)