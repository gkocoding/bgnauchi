from django import forms
from .models import Subject


class PDFImportForm(forms.Form):
    pdf_file = forms.FileField(label="PDF файл с теста")
    title = forms.CharField(label="Заглавие на теста", max_length=255)
    grade = forms.IntegerField(label="Клас")
    subject = forms.ModelChoiceField(queryset=Subject.objects.all(), label="Предмет")
    exam_type = forms.ChoiceField(
        label="Тип",
        choices=[('matura', 'Матура'), ('kandidatstudentski', 'Кандидатстудентски')],
    )