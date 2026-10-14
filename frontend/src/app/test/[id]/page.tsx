"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { Logo } from "@/components/Nav";
import Loader from "@/components/Loader";

type Question = {
    id: number;
    text: string;
    image: string | null;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    topic?: string;
    points?: number;
};

type Exam = {
    id: number;
    title: string;
    grade: number;
    exam_type: string;
    exam_label?: string;
    duration_minutes?: number;
    questions: Question[];
};

type CheckResult = {
    score: number;
    total: number;
    earned_points?: number;
    max_points?: number;
    mon_grade?: number;
    correct_answers: Record<string, string>;
    explanations?: Record<string, string>;
};

const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

const FORMULAS_BY_GRADE: Record<number, { title: string; math: string }[]> = {
    4: [
        { title: "Обиколка на правоъгълник", math: "P = 2 \\cdot a + 2 \\cdot b" },
        { title: "Лице на правоъгълник", math: "S = a \\cdot b" },
        { title: "Път, скорост и време", math: "S = v \\cdot t" },
    ],
    7: [
        { title: "Квадрат на сбор/разлика", math: "(a \\pm b)^2 = a^2 \\pm 2ab + b^2" },
        { title: "Разлика на квадрати", math: "a^2 - b^2 = (a - b)(a + b)" },
        { title: "Куб на сбор/разлика", math: "(a \\pm b)^3 = a^3 \\pm 3a^2b + 3ab^2 \\pm b^3" },
        { title: "Лице на триъгълник", math: "S = \\frac{a \\cdot h_a}{2}" },
    ],
    10: [
        { title: "Квадратно уравнение", math: "D = b^2 - 4ac, \\quad x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}" },
        { title: "Формули на Виет", math: "x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 x_2 = \\frac{c}{a}" },
        { title: "Косинусова теорема", math: "c^2 = a^2 + b^2 - 2ab\\cos\\gamma" },
        { title: "Синусова теорема", math: "\\frac{a}{\\sin\\alpha} = \\frac{b}{\\sin\\beta} = 2R" },
    ],
    12: [
        { title: "Логаритъм", math: "\\log_a(xy) = \\log_a x + \\log_a y" },
        { title: "Производна на степен", math: "(x^n)' = n \\cdot x^{n-1}" },
        { title: "Аритметична прогресия", math: "a_n = a_1 + (n-1)d, \\quad S_n = \\frac{a_1+a_n}{2}n" },
        { title: "Геометрична прогресия", math: "a_n = a_1 \\cdot q^{n-1}, \\quad S_n = a_1\\frac{q^n-1}{q-1}" },
    ],
};

function renderTextWithMath(text: string) {
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let buffer = "";
    let key = 0;

    function flushBuffer() {
        if (buffer) {
            nodes.push(<span key={key++}>{buffer}</span>);
            buffer = "";
        }
    }

    function readBraceGroup(str: string, start: number): [string, number] {
        let depth = 0;
        let j = start;
        for (; j < str.length; j++) {
            if (str[j] === "{") depth++;
            else if (str[j] === "}") {
                depth--;
                if (depth === 0) return [str.slice(start, j + 1), j + 1];
            }
        }
        return [str.slice(start), str.length];
    }

    while (i < text.length) {
        if (text[i] === "\\" && /[a-zA-Z]/.test(text[i + 1] || "")) {
            let j = i + 1;
            while (j < text.length && /[a-zA-Z]/.test(text[j])) j++;
            let mathExpr = text.slice(i, j);
            let groupsRead = 0;
            while (groupsRead < 2 && text[j] === "{") {
                const [group, nextIndex] = readBraceGroup(text, j);
                mathExpr += group;
                j = nextIndex;
                groupsRead++;
            }
            flushBuffer();
            try {
                nodes.push(<InlineMath key={key++} math={mathExpr} />);
            } catch {
                nodes.push(<span key={key++}>{mathExpr}</span>);
            }
            i = j;
            continue;
        }
        buffer += text[i];
        i++;
    }
    flushBuffer();
    return nodes;
}

function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TestPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const isMistakesMode = examId === "mistakes";

    const [exam, setExam] = useState<Exam | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Record<number, boolean>>({});
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [showPalette, setShowPalette] = useState(false);
    const [showFormulas, setShowFormulas] = useState(false);
    const [scratchpadActive, setScratchpadActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(75 * 60);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push(`/login?next=/test/${examId}`);
            return;
        }

        const loadExam = async () => {
            try {
                const res = isMistakesMode
                    ? await apiFetch("/api/mistakes-exam/")
                    : await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/`);
                if (!res.ok) throw new Error("not found");
                const data: Exam = await res.json();
                setExam(data);
                setSecondsLeft((data.duration_minutes || 75) * 60);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        };
        loadExam();
    }, [examId, isMistakesMode, router]);

    useEffect(() => {
        if (loading || !exam || result) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, exam, result]);

    useEffect(() => {
        if (loading || !exam || result) return;
        const handleVisibility = () => {
            if (document.hidden) setTabSwitches((prev) => prev + 1);
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [loading, exam, result]);

    useEffect(() => {
        const resize = () => {
            const c = canvasRef.current;
            if (!c) return;
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    function clearScratchpad() {
        const c = canvasRef.current;
        if (!c) return;
        c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    }

    function startDrawing(x: number, y: number) {
        if (!scratchpadActive) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        isDrawingRef.current = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    function moveDrawing(x: number, y: number) {
        if (!scratchpadActive || !isDrawingRef.current) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#2563EB";
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawingRef.current = false;
    }

    async function submitAnswers() {
        setSubmitting(true);
        const endpoint = isMistakesMode ? "/api/mistakes-exam/" : `/api/exams/${examId}/check/`;
        const res = await apiFetch(endpoint, {
            method: "POST",
            body: JSON.stringify({
                answers,
                duration_seconds: elapsedSeconds,
                tab_switches: tabSwitches,
            }),
        });
        if (!res.ok) {
            setSubmitting(false);
            alert("Възникна грешка при проверката. Опитай отново.");
            return;
        }
        const data: CheckResult = await res.json();
        setResult(data);
        setScratchpadActive(false);
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function selectAnswer(questionId: number, option: string) {
        setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));
    }

    function toggleFlag(questionId: number) {
        setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
    }

    function retry() {
        setResult(null);
        setAnswers({});
        setFlagged({});
        setCurrentIndex(0);
        setElapsedSeconds(0);
        setTabSwitches(0);
        setSecondsLeft((exam?.duration_minutes || 75) * 60);
        clearScratchpad();
        window.scrollTo({ top: 0 });
    }

    useEffect(() => {
        if (!exam || result) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            const q = exam.questions[currentIndex];
            if (!q) return;
            const byKey: Record<string, string> = { "1": "a", "2": "b", "3": "c", "4": "d" };
            if (byKey[e.key]) selectAnswer(q.id, byKey[e.key]);
            else if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
            else if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1));
            else if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "ф") toggleFlag(q.id);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    if (loading) return <Loader />;

    if (!exam || exam.questions.length === 0) {
        return (
            <main className="grid min-h-screen place-items-center px-5">
                <div className="sheet max-w-md p-10 text-center">
                    <p className="mb-2 font-display text-xl font-bold text-slate-950">Няма налични въпроси</p>
                    <p className="mb-6 text-sm text-slate-500">Този модул все още се подготвя.</p>
                    <Link href="/" className="btn">
                        Към началната страница
                    </Link>
                </div>
            </main>
        );
    }

    const gradeBadge = exam.exam_label || (exam.grade === 12 ? "ДЗИ (Матура)" : `НВО • ${exam.grade}. клас`);

    // --- ЕКРАН С РЕЗУЛТАТИ ---
    if (result) {
        const wrongQuestions = exam.questions
            .map((q, idx) => ({ q, n: idx + 1 }))
            .filter(({ q }) => answers[String(q.id)] !== result.correct_answers[String(q.id)]);
        const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

        return (
            <div className="min-h-screen bg-[#F4F6F9] pb-24">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
                        <Logo />
                        <Link href="/profile" className="btn btn-white btn-sm">
                            Към Моят напредък
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl px-5 pt-8">
                    <div className="sheet mb-10 p-8 sm:p-10">
                        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                            <div>
                                <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 font-display text-xs font-bold text-blue-700">
                                    Завършен изпитен модул • {gradeBadge}
                                </span>
                                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                                    {exam.title}
                                </h1>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    {result.mon_grade && (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                                            <span className="block text-[11px] font-bold uppercase text-emerald-700">
                                                Оценка по МОН
                                            </span>
                                            <span className="font-display text-2xl font-black text-emerald-900">
                                                {result.mon_grade.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                                        <span className="block text-[11px] font-bold uppercase text-slate-500">
                                            Верни отговори
                                        </span>
                                        <span className="font-display text-2xl font-black text-slate-950">
                                            {result.score} / {result.total} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                                        <span className="block text-[11px] font-bold uppercase text-slate-500">
                                            Време за работа
                                        </span>
                                        <span className="font-display text-2xl font-black text-slate-950">
                                            {formatTime(elapsedSeconds)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                                <button onClick={retry} className="btn">
                                    Реши теста отново
                                </button>
                                <Link href={`/klas/${exam.grade}`} className="btn btn-white">
                                    Други тестове ({exam.grade}. клас)
                                </Link>
                            </div>
                        </div>
                    </div>

                    {wrongQuestions.length === 0 ? (
                        <div className="sheet p-10 text-center">
                            <p className="font-display text-2xl font-extrabold text-emerald-700">
                                Перфектен резултат! Нямаш нито една грешка.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="mb-5 font-display text-xl font-extrabold text-slate-950">
                                Детайлен разбор на сбърканите задачи ({wrongQuestions.length})
                            </h2>
                            <div className="space-y-5">
                                {wrongQuestions.map(({ q, n }) => {
                                    const options: [string, string][] = [
                                        ["a", q.option_a],
                                        ["b", q.option_b],
                                        ["c", q.option_c],
                                        ["d", q.option_d],
                                    ];
                                    const yourAnswer = answers[String(q.id)];
                                    const correct = result.correct_answers[String(q.id)];
                                    const explanation = result.explanations?.[String(q.id)];

                                    return (
                                        <div key={q.id} className="sheet p-6 sm:p-8">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-display text-xs font-bold text-slate-700">
                                                    Задача {n}
                                                </span>
                                                {q.topic && (
                                                    <span className="font-display text-xs font-semibold text-slate-500">
                                                        Тема: {q.topic}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mb-6 text-lg font-bold leading-relaxed text-slate-950">
                                                {renderTextWithMath(q.text)}
                                            </p>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {options.map(([key, label]) => {
                                                    const isCorrect = key === correct;
                                                    const isWrong = key === yourAnswer && !isCorrect;
                                                    return (
                                                        <div
                                                            key={key}
                                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                                                                isCorrect
                                                                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950"
                                                                    : isWrong
                                                                    ? "border-red-500 bg-red-50/70 text-red-950"
                                                                    : "border-slate-200 bg-white text-slate-600"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-xs font-extrabold ${
                                                                    isCorrect
                                                                        ? "bg-emerald-600 text-white"
                                                                        : isWrong
                                                                        ? "bg-red-600 text-white"
                                                                        : "bg-slate-100 text-slate-700"
                                                                }`}
                                                            >
                                                                {optionLetter[key]}
                                                            </span>
                                                            <span className="flex-1">{renderTextWithMath(label)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {explanation && (
                                                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                                                    <p className="mb-1 font-display text-xs font-extrabold uppercase tracking-wider text-blue-900">
                                                        Решение стъпка по стъпка
                                                    </p>
                                                    <div className="text-sm leading-relaxed text-slate-800">
                                                        {renderTextWithMath(explanation)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // --- АКТИВЕН ИЗПИТЕН ВЪПРОС ---
    const q = exam.questions[currentIndex];
    const options: [string, string][] = [
        ["a", q.option_a],
        ["b", q.option_b],
        ["c", q.option_c],
        ["d", q.option_d],
    ];
    const selected = answers[String(q.id)];
    const isFlagged = Boolean(flagged[q.id]);
    const answeredCount = Object.keys(answers).length;
    const allAnswered = exam.questions.every((qq) => answers[String(qq.id)]);
    const formulas = FORMULAS_BY_GRADE[exam.grade] || FORMULAS_BY_GRADE[10];

    return (
        <div className="min-h-screen bg-[#F4F6F9] pb-20">
            <canvas
                ref={canvasRef}
                onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                onMouseMove={(e) => moveDrawing(e.clientX, e.clientY)}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`fixed inset-0 z-20 ${scratchpadActive ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"}`}
            />

            {/* Горен команден бар на изпита */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
                        <span className="hidden font-display text-xs font-bold text-slate-600 sm:inline-block">
                            {exam.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div
                            className={`rounded-lg border px-3 py-1.5 font-display text-xs font-extrabold ${
                                secondsLeft < 300
                                    ? "border-red-300 bg-red-50 text-red-700"
                                    : "border-slate-200 bg-slate-50 text-slate-900"
                            }`}
                        >
                            ⏱ {formatTime(secondsLeft)}
                        </div>
                        <Link
                            href={`/klas/${exam.grade}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 font-display text-xs font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-950"
                        >
                            Изход
                        </Link>
                    </div>
                </div>

                {/* Тънка линия за общ прогрес */}
                <div className="h-1 w-full bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.round((answeredCount / exam.questions.length) * 100)}%` }}
                    />
                </div>
            </header>

            <main className="relative z-30 mx-auto max-w-3xl px-5 pt-6">
                {/* Инструментален панел */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPalette((v) => !v)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-display text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-900"
                        >
                            Въпрос {currentIndex + 1} от {exam.questions.length} ▾
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleFlag(q.id)}
                            className={`rounded-lg border px-3 py-1.5 font-display text-xs font-bold transition ${
                                isFlagged
                                    ? "border-amber-400 bg-amber-50 text-amber-900"
                                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-950"
                            }`}
                        >
                            {isFlagged ? "★ Маркиран за преглед" : "☆ Маркирай (F)"}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFormulas(true)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-display text-xs font-bold text-slate-700 transition hover:border-slate-900"
                        >
                            Формули МОН
                        </button>
                        <button
                            type="button"
                            onClick={() => setScratchpadActive((v) => !v)}
                            className={`rounded-lg border px-3 py-1.5 font-display text-xs font-bold transition ${
                                scratchpadActive
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                            }`}
                        >
                            {scratchpadActive ? "Чернова: Активна" : "Чернова"}
                        </button>
                        {scratchpadActive && (
                            <button
                                type="button"
                                onClick={clearScratchpad}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-display text-xs font-bold text-red-700"
                            >
                                Изчисти
                            </button>
                        )}
                    </div>
                </div>

                {/* Падаща матрица с всички въпроси */}
                {showPalette && (
                    <div className="sheet mb-5 p-4">
                        <div className="flex flex-wrap gap-2">
                            {exam.questions.map((qq, idx) => {
                                const ans = Boolean(answers[String(qq.id)]);
                                const flg = Boolean(flagged[qq.id]);
                                const cur = idx === currentIndex;
                                return (
                                    <button
                                        key={qq.id}
                                        type="button"
                                        onClick={() => {
                                            setCurrentIndex(idx);
                                            setShowPalette(false);
                                        }}
                                        className={`relative h-9 w-9 rounded-lg border font-display text-xs font-bold transition ${
                                            cur
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : ans
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"
                                        }`}
                                    >
                                        {idx + 1}
                                        {flg && (
                                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ОСНОВНА КАРТА НА ВЪПРОСА */}
                <div key={q.id} className="sheet p-6 sm:p-10">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-blue-600">
                            {q.topic || gradeBadge}
                        </span>
                        <span className="font-display text-xs font-semibold text-slate-400">
                            {q.points || 1} {q.points === 1 ? "точка" : "точки"}
                        </span>
                    </div>

                    <div className="mb-8 text-xl font-bold leading-relaxed text-slate-950 sm:text-2xl">
                        {renderTextWithMath(q.text)}
                    </div>

                    {q.image && (
                        <div className="mb-8 flex justify-center">
                            <img
                                src={q.image}
                                alt={`Фигура към въпрос ${currentIndex + 1}`}
                                className="max-h-80 max-w-full rounded-xl border border-slate-200 bg-white p-4"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {options.map(([key, label], idx) => {
                            const sel = selected === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => selectAnswer(q.id, key)}
                                    aria-pressed={sel}
                                    className={`group flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                                        sel
                                            ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20"
                                            : "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50/60"
                                    }`}
                                >
                                    <span
                                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-xs font-extrabold transition-colors ${
                                            sel
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white"
                                        }`}
                                    >
                                        {optionLetter[key]}
                                    </span>
                                    <span className="flex-1 text-base font-semibold text-slate-900">
                                        {renderTextWithMath(label)}
                                    </span>
                                    <span className="hidden font-display text-[11px] font-semibold text-slate-300 sm:inline">
                                        [{idx + 1}]
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Долна навигация */}
                <div className="mt-6 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                        className="btn btn-white"
                    >
                        ← Предишен
                    </button>

                    <div className="flex items-center gap-3">
                        {currentIndex < exam.questions.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
                                className="btn"
                            >
                                Следващ въпрос →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submitAnswers}
                                disabled={!allAnswered || submitting}
                                className="btn btn-blue"
                            >
                                {submitting ? "Проверяване..." : "Завърши и провери теста"}
                            </button>
                        )}
                    </div>
                </div>

                {!allAnswered && currentIndex === exam.questions.length - 1 && (
                    <p className="mt-3 text-right font-display text-xs font-semibold text-slate-500">
                        Отговорени са {answeredCount} от {exam.questions.length} въпроса.
                    </p>
                )}
            </main>

            {/* Модал със Справочник формули */}
            {showFormulas && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 backdrop-blur-xs"
                    onClick={() => setShowFormulas(false)}
                >
                    <div
                        className="sheet max-w-lg w-full p-6 sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-display text-lg font-extrabold text-slate-950">
                                Справочник с формули ({exam.grade}. клас)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowFormulas(false)}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 font-display text-xs font-bold text-slate-700"
                            >
                                ✕
                            </button>
                        </div>
                        <ul className="space-y-3">
                            {formulas.map((f) => (
                                <li key={f.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                    <p className="mb-1 font-display text-xs font-bold text-slate-500">{f.title}</p>
                                    <div className="text-base font-semibold text-slate-950">
                                        <InlineMath math={f.math} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}