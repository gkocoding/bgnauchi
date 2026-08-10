import re
import pdfplumber

# Разпознава номериран въпрос: "1.", "2)", "15." в началото на ред
QUESTION_START = re.compile(r'^\s*(\d{1,3})[\.\)]\s+')

# Разпознава вариант на отговор: "А)", "Б.", "A)" и т.н. (кирилица или латиница)
OPTION_START = re.compile(r'^\s*([АБВГABCD])[\.\)]\s+', re.UNICODE)

LETTER_TO_OPTION = {
    "А": "a", "A": "a",
    "Б": "b", "B": "b",
    "В": "c", "C": "c",
    "Г": "d", "D": "d",
}


def extract_text_from_pdf(pdf_file) -> str:
    text_parts = []
    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def parse_questions_from_text(text: str) -> list[dict]:
    # Първо: разбиваме евентуални множество А)/Б)/В)/Г) на ЕДИН ред на отделни редове,
    # защото понякога PDF-ът слага всички отговори на един ред.
    inline_option_split = re.compile(r'(?=[АБВГABCD][\.\)]\s)', re.UNICODE)

    raw_lines = text.split("\n")
    lines = []
    for raw_line in raw_lines:
        # Ако редът съдържа повече от 1 маркер за отговор, разбиваме го
        matches = list(OPTION_START.finditer(raw_line)) if False else None
        parts = inline_option_split.split(raw_line)
        # split() пази текста преди първия маркер като отделна част - махаме празните
        for part in parts:
            if part.strip():
                lines.append(part)

    questions = []
    current = None
    current_option = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        q_match = QUESTION_START.match(line)
        o_match = OPTION_START.match(line)

        if q_match:
            if current and current.get("text"):
                questions.append(current)
            current = {
                "text": line[q_match.end():].strip(),
                "option_a": "", "option_b": "", "option_c": "", "option_d": "",
                "correct_option": "a",
            }
            current_option = None

        elif o_match and current is not None:
            letter = LETTER_TO_OPTION.get(o_match.group(1))
            current_option = letter
            option_text = line[o_match.end():].strip()
            if letter:
                current[f"option_{letter}"] = option_text

        elif current is not None:
            if current_option:
                current[f"option_{current_option}"] += " " + line
            else:
                current["text"] += " " + line

    if current and current.get("text"):
        questions.append(current)

    return questions


def import_exam_from_pdf(pdf_file, exam) -> int:
    """
    Извлича въпроси от PDF файл чрез regex (без AI) и ги създава като
    Question обекти, свързани с подадения exam. Връща броя създадени въпроси.

    ВАЖНО: verния отговор НЕ може да се разпознае автоматично по този начин -
    всички въпроси се създават с correct_option="a" по подразбиране.
    ЗАДЪЛЖИТЕЛНО провери и коригирай верните отговори ръчно след импорт!
    """
    from .models import Question

    pdf_text = extract_text_from_pdf(pdf_file)
    if not pdf_text.strip():
        raise ValueError("Не успях да извлека текст от този PDF файл. Възможно е да е сканирано изображение, не текст.")

    questions_data = parse_questions_from_text(pdf_text)
    if not questions_data:
        raise ValueError(
            "Не намерих разпознаваеми въпроси в текста. "
            "Форматът на този PDF вероятно се различава от очаквания "
            "(номерирани въпроси 1. 2. 3. с варианти А) Б) В) Г))."
        )

    created_count = 0
    for q in questions_data:
        Question.objects.create(
            exam=exam,
            text=q["text"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q["option_c"],
            option_d=q["option_d"],
            correct_option=q["correct_option"],
        )
        created_count += 1

    return created_count