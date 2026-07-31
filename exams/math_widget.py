from django.forms import Textarea
from django.utils.safestring import mark_safe
import json

MATH_GROUPS = {
    "Основни": [
        ("a/b", r"\frac{}{}"),
        ("√", r"\sqrt{}"),
        ("x²", r"^{}"),
        ("x_n", r"_{}"),
        ("±", r"\pm"),
        ("×", r"\times"),
        ("÷", r"\div"),
    ],
    "Сравнения": [
        ("≤", r"\leq"),
        ("≥", r"\geq"),
        ("≠", r"\neq"),
        ("≈", r"\approx"),
    ],
    "Гръцки букви": [
        ("α", r"\alpha"),
        ("β", r"\beta"),
        ("π", r"\pi"),
        ("θ", r"\theta"),
        ("Δ", r"\Delta"),
        ("Σ", r"\Sigma"),
    ],
    "Тригонометрия": [
        ("sin", r"\sin()"),
        ("cos", r"\cos()"),
        ("tan", r"\tan()"),
    ],
    "Логаритми/степени": [
        ("log", r"\log()"),
        ("ln", r"\ln()"),
        ("log_n", r"\log_{}()"),
    ],
    "Анализ 11-12 клас": [
        ("lim", r"\lim_{x \to }"),
        ("∫", r"\int"),
        ("d/dx", r"\frac{d}{dx}"),
        ("∞", r"\infty"),
    ],
    "Множества/логика": [
        ("∈", r"\in"),
        ("∪", r"\cup"),
        ("∩", r"\cap"),
        ("∅", r"\emptyset"),
    ],
    "Вектори/геометрия": [
        ("vec", r"\vec{}"),
        ("∠", r"\angle"),
        ("⊥", r"\perp"),
        ("∥", r"\parallel"),
    ],
    "Комбинаторика": [
        ("nCr", r"\binom{n}{r}"),
        ("n!", r"!"),
    ],
}


class MathSymbolWidget(Textarea):
    """Textarea с toolbar за вкарване на LaTeX символи."""

    def render(self, name, value, attrs=None, renderer=None):
        textarea_html = super().render(name, value, attrs, renderer)
        widget_id = attrs.get("id", f"id_{name}") if attrs else f"id_{name}"

        buttons_html = ""
        for group_name, symbols in MATH_GROUPS.items():
            buttons_html += f'<div class="math-group"><span class="math-group-label">{group_name}</span>'
            for label, latex in symbols:
                # json.dumps прави безопасен escape, после го сложим в HTML атрибут
                # ключово: слагаме резултата в data-атрибут, НЕ в onclick код
                latex_attr = latex.replace('"', "&quot;")
                buttons_html += (
                    f'<button type="button" class="math-symbol-btn" '
                    f'data-target="{widget_id}" data-latex="{latex_attr}">{label}</button>'
                )
            buttons_html += "</div>"

        # JS само веднъж - делегиран event listener на document, работи за всички widget-и наведнъж
        script = """
        <script>
        (function() {
            if (window.__mathToolbarInitialized) { return; }
            window.__mathToolbarInitialized = true;

            document.addEventListener('click', function(e) {
                var btn = e.target.closest('.math-symbol-btn');
                if (!btn) { return; }

                var targetId = btn.getAttribute('data-target');
                var latex = btn.getAttribute('data-latex');
                var textarea = document.getElementById(targetId);
                if (!textarea) {
                    console.warn('Math toolbar: textarea not found for id', targetId);
                    return;
                }

                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var text = textarea.value;

                textarea.value = text.slice(0, start) + latex + text.slice(end);

                // курсора - слагаме го между първите {} ако ги има, иначе след вмъкнатия текст
                var cursorPos = start + latex.length;
                var braceIndex = latex.indexOf('{}');
                if (braceIndex !== -1) {
                    cursorPos = start + braceIndex + 1;
                }
                textarea.focus();
                textarea.setSelectionRange(cursorPos, cursorPos);
            });
        })();
        </script>
        """
        buttons_html = ""
        for group_name, symbols in MATH_GROUPS.items():
            buttons_html += f'<div class="math-group"><span class="math-group-label">{group_name}</span><div class="math-group-buttons">'
            for label, latex in symbols:
                latex_attr = latex.replace('"', "&quot;")
                buttons_html += (
                    f'<button type="button" class="math-symbol-btn" '
                    f'data-target="{widget_id}" data-latex="{latex_attr}">{label}</button>'
                )
            buttons_html += "</div></div>"

        style = """
                <style>
                .math-toolbar {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 8px;
                    padding: 8px;
                    background: #1e1e1e;
                    border: 1px solid #333;
                    border-radius: 6px;
                    max-width: 600px;
                }
                .math-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .math-group-label {
                    font-size: 11px;
                    color: #999;
                    width: 110px;
                    flex-shrink: 0;
                    text-align: right;
                    padding-right: 6px;
                }
                .math-group-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                .math-symbol-btn {
                    background: #333;
                    color: #eee;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 3px 8px;
                    font-size: 13px;
                    cursor: pointer;
                    min-width: 28px;
                }
                .math-symbol-btn:hover {
                    background: #4a4a4a;
                    border-color: #777;
                }
                .math-symbol-btn:active {
                    background: #555;
                }
                </style>
                """
        html = f'{style}<div class="math-toolbar">{buttons_html}</div>{textarea_html}{script}'
        return mark_safe(html)