"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { Logo } from "@/components/Nav";
import { renderTextWithMath } from "@/components/MathText";
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

type ToolType = "pencil" | "marker" | "line" | "rect" | "circle" | "eraser" | "text";

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
        { title: "Перпендикулярни вектори", math: "\\vec{a} \\perp \\vec{b} \\iff x_1 x_2 + y_1 y_2 = 0" },
        { title: "Логаритъм", math: "\\log_a(xy) = \\log_a x + \\log_a y" },
        { title: "Производна на степен", math: "(x^n)' = n \\cdot x^{n-1}" },
        { title: "Аритметична прогресия", math: "a_n = a_1 + (n-1)d, \\quad S_n = \\frac{a_1+a_n}{2}n" },
        { title: "Геометрична прогресия", math: "a_n = a_1 \\cdot q^{n-1}, \\quad S_n = a_1\\frac{q^n-1}{q-1}" },
    ],
};

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

    // Състояния за Студийната Чернова
    const [showNotebook, setShowNotebook] = useState(false);
    const [tool, setTool] = useState<ToolType>("pencil");
    const [penColor, setPenColor] = useState<string>("#1E40AF");
    const [strokeSize, setStrokeSize] = useState<number>(2.5);
    const [notebookText, setNotebookText] = useState<string>("");
    const [history, setHistory] = useState<ImageData[]>([]);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
        x: 0,
        y: 0,
        visible: false,
    });

    const [secondsLeft, setSecondsLeft] = useState(75 * 60);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sheetContainerRef = useRef<HTMLDivElement | null>(null);
    const isDrawingRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const snapshotRef = useRef<ImageData | null>(null);

    useEffect(() => {
        document.title = "БГнаучи | Изпитен тест";
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
                document.title = `БГнаучи | ${data.title}`;
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

    // ТОЧНА СИНХРОНИЗАЦИЯ НА РАЗМЕРА НА ПЛАТНОТО (Поправя всяко разминаване на курсора!)
    useEffect(() => {
        if (!showNotebook) return;
        const c = canvasRef.current;
        const container = sheetContainerRef.current;
        if (!c || !container) return;

        const syncCanvasSize = () => {
            const rect = container.getBoundingClientRect();
            const targetW = Math.round(rect.width);
            const targetH = Math.round(rect.height);
            if (targetW === 0 || targetH === 0) return;

            if (c.width !== targetW || c.height !== targetH) {
                const ctx = c.getContext("2d");
                let saved: ImageData | null = null;
                if (c.width > 0 && c.height > 0 && ctx) {
                    saved = ctx.getImageData(0, 0, c.width, c.height);
                }
                c.width = targetW;
                c.height = targetH;
                if (saved && ctx) {
                    ctx.putImageData(saved, 0, 0);
                }
            }
        };

        syncCanvasSize();
        const observer = new ResizeObserver(syncCanvasSize);
        observer.observe(container);
        window.addEventListener("resize", syncCanvasSize);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", syncCanvasSize);
        };
    }, [showNotebook]);

    // 100% прецизно изчисляване на координатите точно под върха на мишката
    function getExactCoords(e: React.PointerEvent<HTMLCanvasElement>) {
        const c = canvasRef.current;
        if (!c) return { x: 0, y: 0, cssX: 0, cssY: 0 };
        const rect = c.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        const scaleX = rect.width > 0 ? c.width / rect.width : 1;
        const scaleY = rect.height > 0 ? c.height / rect.height : 1;
        return {
            x: cssX * scaleX,
            y: cssY * scaleY,
            cssX,
            cssY,
        };
    }

    function saveHistorySnapshot() {
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx || c.width === 0 || c.height === 0) return;
        const img = ctx.getImageData(0, 0, c.width, c.height);
        setHistory((prev) => [...prev.slice(-19), img]);
    }

    function handleUndo() {
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx || history.length === 0) return;
        const previous = history[history.length - 1];
        ctx.putImageData(previous, 0, 0);
        setHistory((prev) => prev.slice(0, -1));
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (tool === "text") return;
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return;

        c.setPointerCapture(e.pointerId);
        saveHistorySnapshot();

        const pos = getExactCoords(e);
        startPosRef.current = { x: pos.x, y: pos.y };
        lastPosRef.current = { x: pos.x, y: pos.y };
        snapshotRef.current = ctx.getImageData(0, 0, c.width, c.height);
        isDrawingRef.current = true;

        // Рисува точка веднага при единичен клик
        if (tool === "pencil" || tool === "eraser" || tool === "marker") {
            ctx.beginPath();
            if (tool === "eraser") {
                ctx.globalCompositeOperation = "destination-out";
                ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
                ctx.fill();
            } else if (tool === "pencil") {
                ctx.globalCompositeOperation = "source-over";
                ctx.fillStyle = penColor;
                ctx.arc(pos.x, pos.y, strokeSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        const pos = getExactCoords(e);
        setCursorPos({ x: pos.cssX, y: pos.cssY, visible: true });

        if (!isDrawingRef.current || tool === "text") return;
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return;

        if (tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 26;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastPosRef.current = { x: pos.x, y: pos.y };
            return;
        }

        if (tool === "pencil") {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = penColor;
            ctx.lineWidth = strokeSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastPosRef.current = { x: pos.x, y: pos.y };
            return;
        }

        if (tool === "marker") {
            if (snapshotRef.current) {
                ctx.putImageData(snapshotRef.current, 0, 0);
            }
            ctx.globalCompositeOperation = "source-over";
            ctx.save();
            ctx.globalAlpha = 0.32;
            ctx.strokeStyle = penColor === "#090D16" ? "#FACC15" : penColor;
            ctx.lineWidth = 18;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
            ctx.lineTo(pos.x, startPosRef.current.y + (pos.y - startPosRef.current.y) * 0.15);
            ctx.stroke();
            ctx.restore();
            return;
        }

        // Чертожни инструменти: Линия, Правоъгълник, Кръг
        if (snapshotRef.current) {
            ctx.putImageData(snapshotRef.current, 0, 0);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = penColor;
        ctx.lineWidth = strokeSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const sx = startPosRef.current.x;
        const sy = startPosRef.current.y;

        ctx.beginPath();
        if (tool === "line") {
            ctx.moveTo(sx, sy);
            ctx.lineTo(pos.x, pos.y);
        } else if (tool === "rect") {
            ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
        } else if (tool === "circle") {
            const r = Math.hypot(pos.x - sx, pos.y - sy);
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
        }
        ctx.stroke();
    }

    function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const c = canvasRef.current;
        if (c && c.hasPointerCapture(e.pointerId)) {
            c.releasePointerCapture(e.pointerId);
        }
        const ctx = c?.getContext("2d");
        if (ctx) {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
        }
    }

    function clearNotebookAll() {
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (c && ctx) {
            saveHistorySnapshot();
            ctx.clearRect(0, 0, c.width, c.height);
        }
        setNotebookText("");
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
        setShowNotebook(false);
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
        clearNotebookAll();
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
                        Към Начало
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
                    <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
                        <Logo />
                        <Link href="/profile" className="btn btn-white btn-sm">
                            Към Профил
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl px-5 pt-8">
                    <div className="sheet mb-10 p-8 sm:p-10">
                        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
                            <div>
                                <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 font-display text-xs font-bold text-blue-700">
                                    Завършен изпитен протокол • {gradeBadge}
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
                                                    Задача № {n}
                                                </span>
                                                {q.topic && (
                                                    <span className="font-display text-xs font-semibold text-slate-500">
                                                        Тема: {q.topic}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-6 text-lg font-bold leading-relaxed text-slate-950">
                                                {renderTextWithMath(q.text)}
                                            </div>

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
                                                                {optionLetter[key]})
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

    // Размер на визуалния курсор според избрания инструмент
    const indicatorSize = tool === "eraser" ? 26 : tool === "marker" ? 18 : Math.max(6, strokeSize * 2);

    return (
        <div className="min-h-screen bg-[#F4F6F9] pb-20">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <Logo />
                        <span className="hidden h-5 w-px bg-slate-200 md:inline-block" />
                        <div className="hidden min-w-0 md:block">
                            <p className="truncate font-display text-xs font-extrabold text-slate-900">
                                {exam.title}
                            </p>
                            <p className="font-display text-[11px] font-semibold text-slate-500">
                                {gradeBadge}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
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
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-display text-xs font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-950"
                        >
                            Изход
                        </Link>
                    </div>
                </div>

                <div className="h-1 w-full bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.round((answeredCount / exam.questions.length) * 100)}%` }}
                    />
                </div>
            </header>

            <main
                className={`mx-auto px-4 pt-6 transition-all duration-300 sm:px-6 ${
                    showNotebook ? "max-w-[1360px]" : "max-w-3xl"
                }`}
            >
                {/* Инструментален панел над задачата */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPalette((v) => !v)}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-display text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-900"
                        >
                            Задача {currentIndex + 1} от {exam.questions.length} ▾
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleFlag(q.id)}
                            className={`rounded-xl border px-3.5 py-2 font-display text-xs font-bold transition ${
                                isFlagged
                                    ? "border-amber-400 bg-amber-50 text-amber-900"
                                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-950"
                            }`}
                        >
                            {isFlagged ? "★ Маркирана" : "☆ Маркирай (F)"}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFormulas(true)}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-display text-xs font-bold text-slate-700 transition hover:border-slate-900"
                        >
                            Формули МОН
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowNotebook((v) => !v)}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-display text-xs font-extrabold transition ${
                                showNotebook
                                    ? "border-blue-600 bg-blue-600 text-white shadow-md"
                                    : "border-slate-900 bg-slate-950 text-white hover:bg-blue-600 hover:border-blue-600"
                            }`}
                        >
                            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 3h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm3 0v14M3 7h4M3 11h4" strokeLinecap="round" />
                            </svg>
                            {showNotebook ? "Скрий черновата" : "Чернова"}
                        </button>
                    </div>
                </div>

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

                {/* ОСНОВЕН ГРИД: Изпитен лист вляво + Премиум Тетрадъчно Студио вдясно */}
                <div className={`grid items-start gap-6 ${showNotebook ? "lg:grid-cols-[1fr_1.05fr]" : "grid-cols-1"}`}>

                    {/* ЛЯВА КОЛОНА: ИЗПИТЕН ЛИСТ НА МОН */}
                    <div>
                        <div key={q.id} className="sheet overflow-hidden p-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-6 py-4 sm:px-8">
                                <div className="flex items-center gap-3">
                                    <span className="rounded-lg bg-slate-950 px-3 py-1 font-display text-xs font-extrabold tracking-wider text-white">
                                        ЗАДАЧА № {currentIndex + 1}
                                    </span>
                                    <span className="font-display text-xs font-bold uppercase tracking-wide text-blue-600">
                                        {q.topic || "Общи задачи"}
                                    </span>
                                </div>
                                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-display text-xs font-extrabold text-slate-700">
                                    {q.points || 1} {(q.points || 1) === 1 ? "точка" : "точки"}
                                </span>
                            </div>

                            <div className="p-6 sm:p-9">
                                <div className="mb-8 text-xl font-bold leading-relaxed text-slate-950 sm:text-[1.35rem]">
                                    {renderTextWithMath(q.text)}
                                </div>

                                {q.image && (
                                    <div className="mb-8 flex justify-center">
                                        <img
                                            src={q.image}
                                            alt={`Чертеж към задача ${currentIndex + 1}`}
                                            className="max-h-80 max-w-full rounded-xl border border-slate-200 bg-white p-4"
                                        />
                                    </div>
                                )}

                                <p className="mb-3 font-display text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Изберете верния отговор (клавиши 1 – 4):
                                </p>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {options.map(([key, label], idx) => {
                                        const sel = selected === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => selectAnswer(q.id, key)}
                                                aria-pressed={sel}
                                                className={`group flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all ${
                                                    sel
                                                        ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20"
                                                        : "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50/70"
                                                }`}
                                            >
                                                <span
                                                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border font-display text-xs font-extrabold transition-colors ${
                                                        sel
                                                            ? "border-blue-600 bg-blue-600 text-white"
                                                            : "border-slate-300 bg-slate-50 text-slate-800 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white"
                                                    }`}
                                                >
                                                    {optionLetter[key]})
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
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                                disabled={currentIndex === 0}
                                className="btn btn-white"
                            >
                                ← Предишна
                            </button>

                            <div className="flex items-center gap-3">
                                {currentIndex < exam.questions.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
                                        className="btn"
                                    >
                                        Следваща задача →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={submitAnswers}
                                        disabled={!allAnswered || submitting}
                                        className="btn btn-blue"
                                    >
                                        {submitting ? "Проверяване..." : "Предай изпитния лист"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ДЯСНА КОЛОНА: НОВА СТУДИЙНА ЧЕРНОВА (БЕЗ РАЗМИНАВАНЕ НА КУРСОРА) */}
                    {showNotebook && (
                        <aside className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.16)]">
                            {/* Елегантен Studio Док с SVG инструменти */}
                            <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    {/* Група Инструменти */}
                                    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                                        {[
                                            {
                                                id: "pencil",
                                                title: "Молив",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z" strokeLinejoin="round" />
                                                    </svg>
                                                ),
                                            },
                                            {
                                                id: "marker",
                                                title: "Маркер",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M11 4l5 5-7 7H4v-5l7-7zM3 17h14" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ),
                                            },
                                            {
                                                id: "line",
                                                title: "Линийка",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M4 16L16 4" strokeLinecap="round" />
                                                        <circle cx="4" cy="16" r="1.5" fill="currentColor" />
                                                        <circle cx="16" cy="4" r="1.5" fill="currentColor" />
                                                    </svg>
                                                ),
                                            },
                                            {
                                                id: "rect",
                                                title: "Правоъгълник",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <rect x="3" y="5" width="14" height="10" rx="1.5" />
                                                    </svg>
                                                ),
                                            },
                                            {
                                                id: "circle",
                                                title: "Окръжност",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <circle cx="10" cy="10" r="6.5" />
                                                    </svg>
                                                ),
                                            },
                                            {
                                                id: "eraser",
                                                title: "Гума",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M7 16h9M11.5 4.5l4 4-7 7-4-4 7-7z" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ),
                                            },
                                            {
                                                id: "text",
                                                title: "Текст",
                                                icon: (
                                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M4 5h12M10 5v11M7 16h6" strokeLinecap="round" />
                                                    </svg>
                                                ),
                                            },
                                        ].map((item) => {
                                            const active = tool === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setTool(item.id as ToolType)}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-display text-xs font-bold transition ${
                                                        active
                                                            ? "bg-slate-950 text-white shadow-2xs"
                                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                                    }`}
                                                >
                                                    {item.icon}
                                                    <span>{item.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Действия: Undo и Изчисти */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={handleUndo}
                                            disabled={history.length === 0}
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-display text-xs font-bold text-slate-700 transition hover:border-slate-900 disabled:opacity-40"
                                        >
                                            ↩ Назад
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearNotebookAll}
                                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-display text-xs font-bold text-red-700 transition hover:bg-red-100"
                                        >
                                            Изчисти
                                        </button>
                                    </div>
                                </div>

                                {/* Втори ред: Палитра с мастила и дебелина */}
                                {tool !== "eraser" && tool !== "text" && (
                                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Мастило:
                                            </span>
                                            {[
                                                { c: "#1E40AF", label: "Кралско синьо" },
                                                { c: "#090D16", label: "Обсидиан" },
                                                { c: "#DC2626", label: "Рубинено червено" },
                                                { c: "#059669", label: "Изумрудено" },
                                                { c: "#D97706", label: "Кехлибар" },
                                            ].map((col) => (
                                                <button
                                                    key={col.c}
                                                    type="button"
                                                    onClick={() => setPenColor(col.c)}
                                                    title={col.label}
                                                    style={{ backgroundColor: col.c }}
                                                    className={`h-5 w-5 rounded-full transition-transform ${
                                                        penColor === col.c
                                                            ? "scale-115 ring-2 ring-slate-950 ring-offset-2"
                                                            : "opacity-70 hover:opacity-100"
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Писец:
                                            </span>
                                            {[
                                                { s: 2, label: "Тънък" },
                                                { s: 3.5, label: "Среден" },
                                                { s: 5.5, label: "Плътен" },
                                            ].map((sz) => (
                                                <button
                                                    key={sz.s}
                                                    type="button"
                                                    onClick={() => setStrokeSize(sz.s)}
                                                    className={`rounded-md px-2.5 py-0.5 font-display text-[11px] font-bold transition ${
                                                        strokeSize === sz.s
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                                                    }`}
                                                >
                                                    {sz.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ТЕТРАДЪЧЕН ЛИСТ С ШИРОКИ РЕДОВЕ И ТОЧЕН ПРИЦЕЛ */}
                            <div
                                ref={sheetContainerRef}
                                className="lined-notebook-sheet relative h-[512px] w-full select-none overflow-hidden"
                            >
                                {/* Двойна вертикална червена линия за полето на тетрадката */}
                                <div className="pointer-events-none absolute top-0 bottom-0 left-12 w-[1.5px] bg-red-400/70" />
                                <div className="pointer-events-none absolute top-0 bottom-0 left-[52px] w-[1px] bg-red-300/50" />

                                {/* Воден знак горе вдясно на листа */}
                                <div className="pointer-events-none absolute top-2 right-4 font-display text-[11px] font-bold uppercase tracking-widest text-slate-300">
                                    Чернова • Задача № {currentIndex + 1}
                                </div>

                                {/* Слой за писане с клавиатура точно върху редовете */}
                                <textarea
                                    value={notebookText}
                                    onChange={(e) => setNotebookText(e.target.value)}
                                    placeholder="Въведи сметки от клавиатурата или избери Молив, за да чертаеш..."
                                    className={`absolute inset-0 h-full w-full resize-none bg-transparent py-0 pr-5 pl-16 font-display text-[15px] font-semibold text-slate-800 placeholder:text-slate-400/70 focus:outline-none ${
                                        tool === "text" ? "z-20 pointer-events-auto" : "z-10 pointer-events-none"
                                    }`}
                                    style={{ lineHeight: "32px" }}
                                />

                                {/* Визуален индикатор точно под върха на курсора */}
                                {cursorPos.visible && tool !== "text" && (
                                    <div
                                        className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-75"
                                        style={{
                                            left: `${cursorPos.x}px`,
                                            top: `${cursorPos.y}px`,
                                            width: `${indicatorSize}px`,
                                            height: `${indicatorSize}px`,
                                            border:
                                                tool === "eraser"
                                                    ? "2px solid #090D16"
                                                    : `1.5px solid ${penColor}`,
                                            backgroundColor:
                                                tool === "eraser"
                                                    ? "rgba(255,255,255,0.75)"
                                                    : tool === "marker"
                                                    ? "rgba(250,204,21,0.35)"
                                                    : "transparent",
                                        }}
                                    />
                                )}

                                {/* Платно за чертане с 1:1 Pointer Capture */}
                                <canvas
                                    ref={canvasRef}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    onPointerLeave={() => setCursorPos((p) => ({ ...p, visible: false }))}
                                    className={`absolute inset-0 block h-full w-full touch-none ${
                                        tool === "text"
                                            ? "z-10 pointer-events-none"
                                            : "z-20 cursor-crosshair pointer-events-auto"
                                    }`}
                                />
                            </div>
                        </aside>
                    )}
                </div>
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