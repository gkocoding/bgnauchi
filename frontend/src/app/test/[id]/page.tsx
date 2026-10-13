"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
};

type Exam = {
    id: number;
    title: string;
    grade: number;
    exam_type: string;
    questions: Question[];
};

type CheckResult = {
    score: number;
    total: number;
    correct_answers: Record<string, string>;
};

// В базата отговорите са a/b/c/d, но в българските изпити се показват като А, Б, В, Г
const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

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
                if (depth === 0) {
                    return [str.slice(start, j + 1), j + 1];
                }
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

            // ВАЖНО: винаги render-ваме командата като математика, дори БЕЗ скоби -
            // символи като \pi, \times, \neq, \infty, \cdot нямат нужда от {} след себе си.
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

/* ---------- Малки помощни компоненти ---------- */

// Ръчно нарисуван кръг около буква (чертае се при показване)
function PenCircle({ color, delay = 0 }: { color: string; delay?: number }) {
    return (
        <svg
            className="pointer-events-none absolute -inset-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)]"
            viewBox="0 0 40 40"
            aria-hidden="true"
        >
            <path
                d="M20 3.5 C 32 2.5, 38 13, 36.5 23 C 35 34, 22 38, 12.5 33 C 3.5 28, 2.5 12, 17 5.5 C 24 2.5, 30 4.5, 33 9"
                pathLength={1}
                className="draw"
                style={{ "--dur": "0.5s", "--delay": `${delay}s` } as CSSProperties}
                fill="none"
                stroke={color}
                strokeWidth="2.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function Check({ delay = 0 }: { delay?: number }) {
    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-ok" aria-hidden="true">
            <path
                d="M4 12.5l5 5L20 6.5"
                pathLength={1}
                className="draw"
                style={{ "--dur": "0.4s", "--delay": `${delay}s` } as CSSProperties}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function useCountUp(target: number, ms = 1200) {
    const [value, setValue] = useState(0);
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    useEffect(() => {
        if (reduce) return;
        let raf = 0;
        const t0 = performance.now() + 350;
        const tick = (now: number) => {
            const t = Math.min(Math.max((now - t0) / ms, 0), 1);
            setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, ms, reduce]);
    return reduce ? target : value;
}

function ScoreRing({ score, total, pct }: { score: number; total: number; pct: number }) {
    const r = 78;
    const c = 2 * Math.PI * r;
    const [ready, setReady] = useState(false);
    const shown = useCountUp(score);

    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <div className="relative h-52 w-52 shrink-0">
            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="90" cy="90" r={r} fill="none" stroke="#E8EDFF" strokeWidth="16" />
                <circle
                    cx="90"
                    cy="90"
                    r={r}
                    fill="none"
                    stroke="#2B50E6"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={ready ? c * (1 - pct / 100) : c}
                    style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.3,0.7,0.2,1) 0.35s" }}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                    <div className="font-display text-5xl font-extrabold leading-none">
                        {shown}
                        <span className="text-3xl text-ink-soft"> / {total}</span>
                    </div>
                    <div className="mt-2 font-display text-sm font-semibold text-ink-soft">{pct}% верни</div>
                </div>
            </div>
        </div>
    );
}

const confettiColors = ["#FFD93D", "#2B50E6", "#C92A43", "#0B7A52", "#FF8FAB"];

function Confetti() {
    const bits = Array.from({ length: 34 }, (_, i) => {
        const angle = (i / 34) * Math.PI * 2 + ((i * 37) % 11) * 0.09;
        const dist = 150 + ((i * 53) % 170);
        return {
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist * 0.8 + 140,
            rot: (i % 2 ? 1 : -1) * (180 + ((i * 29) % 360)),
            delay: 0.25 + (i % 6) * 0.04,
            color: confettiColors[i % confettiColors.length],
        };
    });
    return (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
            {bits.map((b, i) => (
                <span
                    key={i}
                    className="confetti-bit"
                    style={
                        {
                            background: b.color,
                            "--dx": `${b.dx}px`,
                            "--dy": `${b.dy}px`,
                            "--rot": `${b.rot}deg`,
                            "--delay": `${b.delay}s`,
                        } as CSSProperties
                    }
                />
            ))}
        </div>
    );
}

function verdict(pct: number) {
    if (pct === 100) return "Перфектно!";
    if (pct >= 85) return "Отлично!";
    if (pct >= 70) return "Много добре!";
    if (pct >= 50) return "Добра основа!";
    return "Преговори и опитай пак";
}

/* ---------- Страницата ---------- */

export default function TestPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [furthest, setFurthest] = useState(0);
    const [dir, setDir] = useState<"next" | "prev">("next");
    const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push(`/login?next=/test/${examId}`);
            return;
        }

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/`)
            .then((res) => {
                if (!res.ok) throw new Error("not found");
                return res.json();
            })
            .then((data) => {
                setExam(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [examId, router]);

    useEffect(() => {
        return () => {
            if (advanceTimer.current) clearTimeout(advanceTimer.current);
        };
    }, []);

    useEffect(() => {
        if (result) window.scrollTo({ top: 0, behavior: "smooth" });
    }, [result]);

    async function submitAnswers() {
        setSubmitting(true);
        const res = await apiFetch(`/api/exams/${examId}/check/`, {
            method: "POST",
            body: JSON.stringify({ answers }),
        });
        if (!res.ok) {
            setSubmitting(false);
            alert(
                res.status === 429
                    ? "Твърде много опити за кратко време. Опитай пак по-късно."
                    : "Възникна грешка при проверката. Опитай отново."
            );
            return;
        }
        const data: CheckResult = await res.json();
        setResult(data);
        setSubmitting(false);
    }

    function selectAnswer(questionId: number, option: string) {
        setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));

        if (!exam) return;
        const isLast = currentIndex === exam.questions.length - 1;
        if (currentIndex === furthest && !isLast) {
            if (advanceTimer.current) clearTimeout(advanceTimer.current);
            // малко изчакване, за да се види как се чертае кръгчето
            advanceTimer.current = setTimeout(() => {
                setDir("next");
                setCurrentIndex((i) => i + 1);
                setFurthest((f) => f + 1);
            }, 650);
        }
    }

    function goBack() {
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        setDir("prev");
        setCurrentIndex((i) => Math.max(0, i - 1));
    }

    function goNext() {
        if (!exam) return;
        const q = exam.questions[currentIndex];
        const canGo = currentIndex < furthest || (q && answers[String(q.id)]);
        if (!canGo || currentIndex >= exam.questions.length - 1) return;
        setDir("next");
        setCurrentIndex(currentIndex + 1);
        setFurthest((f) => Math.max(f, currentIndex + 1));
    }

    function jumpTo(i: number) {
        if (i > furthest) return;
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        setDir(i >= currentIndex ? "next" : "prev");
        setCurrentIndex(i);
    }

    function retry() {
        setResult(null);
        setAnswers({});
        setCurrentIndex(0);
        setFurthest(0);
        setDir("next");
        window.scrollTo({ top: 0 });
    }

    // Клавиатура: 1–4 избират отговор, стрелките сменят въпроса
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
            else if (e.key === "ArrowLeft") goBack();
            else if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    if (loading) return <Loader />;

    if (!exam) {
        return (
            <main className="grid min-h-screen place-items-center px-5">
                <div className="sheet max-w-md p-10 text-center">
                    <p className="mb-2 font-display text-xl font-bold">Тестът не е намерен</p>
                    <p className="mb-7 text-ink-soft">Възможно е да е премахнат или връзката да е грешна.</p>
                    <Link href="/" className="btn">
                        Към началото
                    </Link>
                </div>
            </main>
        );
    }

    // --- РЕЗУЛТАТ ---
    if (result) {
        const wrongQuestions = exam.questions
            .map((q, idx) => ({ q, n: idx + 1 }))
            .filter(({ q }) => answers[String(q.id)] !== result.correct_answers[String(q.id)]);
        const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

        return (
            <>
                {pct >= 80 && <Confetti />}

                <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:py-6">
                    <Logo />
                </header>

                <main className="mx-auto max-w-3xl px-5 pb-24 pt-2">
                    <div className="sheet mb-8 flex flex-col items-center gap-6 p-7 sm:flex-row sm:gap-10 sm:p-9">
                        <ScoreRing score={result.score} total={result.total} pct={pct} />
                        <div className="text-center sm:text-left">
                            <p className="pop font-hand text-5xl font-bold leading-none text-cobalt-deep" style={{ "--delay": "0.9s" } as CSSProperties}>
                                {verdict(pct)}
                            </p>
                            <p className="mt-3 font-display text-lg font-semibold">{exam.title}</p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
                                <button onClick={retry} className="btn">
                                    Опитай пак
                                </button>
                                <Link href={`/klas/${exam.grade}`} className="btn btn-white">
                                    Други тестове
                                </Link>
                            </div>
                        </div>
                    </div>

                    {wrongQuestions.length === 0 ? (
                        <div className="sheet p-8 text-center">
                            <p className="font-display text-xl font-bold">Всички отговори са верни</p>
                            <p className="mt-1 text-ink-soft">Няма какво да преговаряш в този тест.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">
                                За преговор <span className="text-pen">({wrongQuestions.length})</span>
                            </h2>
                            <ul className="space-y-6">
                                {wrongQuestions.map(({ q, n }, idx) => {
                                    const options: [string, string][] = [
                                        ["a", q.option_a],
                                        ["b", q.option_b],
                                        ["c", q.option_c],
                                        ["d", q.option_d],
                                    ];
                                    const yourAnswer = answers[String(q.id)];
                                    const correct = result.correct_answers[String(q.id)];
                                    const base = 0.3 + Math.min(idx, 6) * 0.12;

                                    return (
                                        <li
                                            key={q.id}
                                            className="sheet drop-in p-5 sm:p-7"
                                            style={{ "--i": Math.min(idx, 6), "--r": "-1.5deg" } as CSSProperties}
                                        >
                                            <p className="mb-2 font-display text-sm font-semibold text-ink-soft">Въпрос {n}</p>
                                            <p className="mb-5 text-lg font-semibold leading-snug">{renderTextWithMath(q.text)}</p>
                                            {q.image && (
                                                <div className="mb-5 flex justify-center">
                                                    <img
                                                        src={q.image}
                                                        alt={`Фигура към въпрос ${n}`}
                                                        className="max-h-72 max-w-full rounded-xl border-2 border-ink bg-white p-3"
                                                    />
                                                </div>
                                            )}
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {options.map(([key, label]) => {
                                                    const isCorrect = key === correct;
                                                    const isWrong = key === yourAnswer && !isCorrect;
                                                    const tone = isCorrect
                                                        ? "border-ok bg-ok-tint"
                                                        : isWrong
                                                        ? "border-pen bg-pen-tint"
                                                        : "border-ink/20 bg-white";
                                                    return (
                                                        <div key={key} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 ${tone}`}>
                                                            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white font-display text-sm font-extrabold">
                                                                {optionLetter[key]}
                                                                {isWrong && <PenCircle color="#C92A43" delay={base} />}
                                                            </span>
                                                            <span className="flex-1 leading-snug">{renderTextWithMath(label)}</span>
                                                            {isCorrect && <Check delay={base + 0.2} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-4 font-hand text-[1.7rem] font-semibold leading-none text-pen">
                                                Верният отговор е {optionLetter[correct] ?? correct}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </main>
            </>
        );
    }

    if (exam.questions.length === 0) {
        return (
            <main className="grid min-h-screen place-items-center px-5">
                <div className="sheet max-w-md border-dashed p-10 text-center">
                    <p className="mb-2 font-display text-xl font-bold">Този тест още няма въпроси</p>
                    <p className="mb-7 text-ink-soft">Опитай друг тест, докато добавим въпросите.</p>
                    <Link href={`/klas/${exam.grade}`} className="btn">
                        Към другите тестове
                    </Link>
                </div>
            </main>
        );
    }

    // --- ВЪПРОС ---
    const q = exam.questions[currentIndex];
    const options: [string, string][] = [
        ["a", q.option_a],
        ["b", q.option_b],
        ["c", q.option_c],
        ["d", q.option_d],
    ];
    const isLast = currentIndex === exam.questions.length - 1;
    const selected = answers[String(q.id)];
    const allAnswered = exam.questions.every((qq) => answers[String(qq.id)]);
    const canNext = currentIndex < furthest || Boolean(selected);

    return (
        <>
            <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5 sm:py-6">
                <Logo />
                <Link href={`/klas/${exam.grade}`} className="marker-line font-display text-sm font-medium text-ink-soft hover:text-ink">
                    Изход от теста
                </Link>
            </header>

            <main className="mx-auto max-w-2xl px-5 pb-20 pt-2">
                <div className="mb-2 flex items-baseline justify-between gap-4">
                    <h1 className="font-display text-lg font-bold leading-snug sm:text-xl">{exam.title}</h1>
                    <span className="shrink-0 font-display text-sm font-semibold text-ink-soft">{exam.grade}. клас</span>
                </div>

                {/* Прогрес: всеки сегмент се запълва като с маркер */}
                <div className="mb-3 mt-4 flex items-center gap-1.5" role="list" aria-label="Въпроси">
                    {exam.questions.map((qq, i) => {
                        const visited = i <= furthest;
                        const answered = Boolean(answers[String(qq.id)]);
                        return (
                            <button
                                key={qq.id}
                                role="listitem"
                                onClick={() => jumpTo(i)}
                                disabled={!visited}
                                aria-label={`Въпрос ${i + 1}${answered ? ", отговорен" : ""}`}
                                aria-current={i === currentIndex ? "step" : undefined}
                                className={`relative h-3.5 flex-1 overflow-hidden rounded-full border-2 bg-white transition-all duration-300 ease-spring ${
                                    i === currentIndex ? "-translate-y-0.5 border-ink shadow-pop-sm" : "border-ink/30"
                                } ${visited ? "" : "opacity-60"}`}
                            >
                                <span
                                    className={`absolute inset-0 origin-left transition-transform duration-500 ease-out ${
                                        answered ? "scale-x-100" : "scale-x-0"
                                    } ${i === currentIndex ? "bg-marker-deep" : "bg-cobalt"}`}
                                />
                            </button>
                        );
                    })}
                </div>
                <p className="mb-6 font-display text-sm font-medium text-ink-soft">
                    Въпрос {currentIndex + 1} от {exam.questions.length}
                </p>

                <div key={q.id} className={`sheet p-5 sm:p-8 ${dir === "next" ? "turn-next" : "turn-prev"}`}>
                    <p className="mb-6 text-xl font-semibold leading-snug sm:text-[1.35rem]">{renderTextWithMath(q.text)}</p>
                    {q.image && (
                        <div className="mb-6 flex justify-center">
                            <img
                                src={q.image}
                                alt={`Фигура към въпрос ${currentIndex + 1}`}
                                className="max-h-80 max-w-full rounded-xl border-2 border-ink bg-white p-3"
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                        {options.map(([key, label]) => {
                            const sel = selected === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => selectAnswer(q.id, key)}
                                    aria-pressed={sel}
                                    className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-200 ease-spring ${
                                        sel
                                            ? "-translate-y-0.5 border-cobalt bg-cobalt-tint shadow-[4px_4px_0_0_#2B50E6]"
                                            : "border-ink bg-white hover:-translate-y-0.5 hover:bg-marker-tint hover:shadow-pop-sm active:translate-y-0.5 active:shadow-none"
                                    }`}
                                >
                                    <span
                                        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-extrabold transition-colors duration-200 ${
                                            sel ? "border-cobalt bg-cobalt text-white" : "border-ink bg-paper"
                                        }`}
                                    >
                                        {optionLetter[key]}
                                        {sel && <PenCircle color="#14213D" />}
                                    </span>
                                    <span className="flex-1 text-[1.05rem] leading-snug">{renderTextWithMath(label)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                    <button onClick={goBack} disabled={currentIndex === 0} className="btn btn-white">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                            <path d="M16 10H4M9 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Назад
                    </button>

                    {isLast ? (
                        <button onClick={submitAnswers} disabled={!allAnswered || submitting} className="btn btn-blue">
                            {submitting ? (
                                <>
                                    <svg viewBox="0 0 24 24" className="writing h-5 w-5" aria-hidden="true">
                                        <path d="M3 21l1.5-5L16 4.5a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L8 19.5 3 21z" fill="#FFD93D" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                                    </svg>
                                    Проверяваме…
                                </>
                            ) : (
                                "Провери резултата"
                            )}
                        </button>
                    ) : (
                        <button onClick={goNext} disabled={!canNext} className="btn btn-white">
                            Напред
                            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                                <path d="M4 10h12M11 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>

                {isLast && !allAnswered && (
                    <p className="mt-4 text-right font-hand text-2xl font-semibold leading-none text-ink-soft">
                        Отговори на всички въпроси, за да провериш резултата
                    </p>
                )}
                <p className="mt-10 hidden font-display text-xs text-ink-soft sm:block">
                    Съвет: натисни 1, 2, 3 или 4 за отговор и стрелките за смяна на въпроса.
                </p>
            </main>
        </>
    );
}
