"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { apiFetch } from "@/lib/api";

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

            if (groupsRead > 0) {
                flushBuffer();
                try {
                    nodes.push(<InlineMath key={key++} math={mathExpr} />);
                } catch {
                    nodes.push(<span key={key++}>{mathExpr}</span>);
                }
                i = j;
                continue;
            }
        }
        buffer += text[i];
        i++;
    }
    flushBuffer();
    return nodes;
}

export default function TestPage() {
    const params = useParams();
    const examId = params.id as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [furthest, setFurthest] = useState(0);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/`)
            .then((res) => res.json())
            .then((data) => {
                setExam(data);
                setLoading(false);
            });
    }, [examId]);

    async function submitAnswers() {
        setSubmitting(true);
        const res = await apiFetch(`/api/exams/${examId}/check/`, {
            method: "POST",
            body: JSON.stringify({ answers }),
        });
        const data: CheckResult = await res.json();
        setResult(data);
        setSubmitting(false);
    }

    function selectAnswer(questionId: number, option: string) {
        setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));

        // Автоматично напред само ако сме на "фронтовия" (най-новия) въпрос
        if (!exam) return;
        const isLast = currentIndex === exam.questions.length - 1;
        if (currentIndex === furthest && !isLast) {
            setTimeout(() => {
                setCurrentIndex((i) => i + 1);
                setFurthest((f) => f + 1);
            }, 400);
        }
    }

    function goBack() {
        setCurrentIndex((i) => Math.max(0, i - 1));
    }

    function goNext() {
        if (!exam) return;
        setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1));
    }

    if (loading) {
        return (
            <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen flex items-center justify-center">
                <p className="font-display text-sm text-[#9CA3C4]">Зареждане...</p>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen flex items-center justify-center">
                <p className="font-display text-sm text-[#9CA3C4]">Тестът не е намерен.</p>
            </div>
        );
    }

    // --- SUMMARY ЕКРАН ---
    if (result) {
        const wrongQuestions = exam.questions.filter(
            (q) => answers[String(q.id)] !== result.correct_answers[String(q.id)]
        );
        const pct = Math.round((result.score / result.total) * 100);

        return (
            <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen relative overflow-hidden">
                <div className="starfield" />
                <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#4FD1C5] opacity-[0.07] blur-[100px]" />
                <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-[#A78BFA] opacity-[0.08] blur-[100px]" />

                <nav className="relative z-10 max-w-3xl mx-auto px-6 py-6">
                    <Link href="/" className="font-display text-xl font-bold tracking-wide">
                        bg<span className="text-[#4FD1C5]">научи</span>
                    </Link>
                </nav>

                <section className="relative z-10 max-w-3xl mx-auto px-6 pt-6 pb-20">
                    <div className="bg-[#141833] border border-white/10 rounded-3xl p-8 text-center mb-8">
                        <div className="text-5xl mb-3">
                            {pct === 100 ? "🎉" : pct >= 50 ? "👍" : "💪"}
                        </div>
                        <div className="font-mono text-4xl font-bold mb-1">
                            {result.score} / {result.total}
                        </div>
                        <p className="text-[#9CA3C4] text-sm">{pct}% верни отговори</p>
                    </div>

                    {wrongQuestions.length === 0 ? (
                        <div className="bg-[#141833] border border-white/10 rounded-3xl p-6 text-center text-[#9CA3C4] text-sm">
                            Всички отговори са верни — перфектна орбита! ✦
                        </div>
                    ) : (
                        <>
                            <h2 className="font-display text-sm font-bold text-[#9CA3C4] uppercase tracking-wider mb-4">
                                Въпроси за преговор ({wrongQuestions.length})
                            </h2>
                            <div className="space-y-4">
                                {wrongQuestions.map((q) => {
                                    const options: [string, string][] = [
                                        ["a", q.option_a],
                                        ["b", q.option_b],
                                        ["c", q.option_c],
                                        ["d", q.option_d],
                                    ];
                                    const yourAnswer = answers[String(q.id)];
                                    const correct = result.correct_answers[String(q.id)];

                                    return (
                                        <div key={q.id} className="bg-[#141833] border border-white/10 rounded-3xl p-6">
                                            <p className="font-display font-bold mb-4">
                                                {renderTextWithMath(q.text)}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {options.map(([key, label]) => {
                                                    let style = "border border-white/10 bg-[#0B0E1A]";
                                                    if (key === correct) {
                                                        style = "border border-[#4ADE80]/60 bg-[#4ADE80]/10";
                                                    } else if (key === yourAnswer) {
                                                        style = "border border-[#F87171]/60 bg-[#F87171]/10";
                                                    }
                                                    return (
                                                        <div key={key} className={`${style} rounded-2xl px-4 py-2.5 text-sm`}>
                                                            <span className="font-semibold uppercase mr-2 font-mono">{key})</span>
                                                            {renderTextWithMath(label)}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-[#9CA3C4] mt-3">
                                                Твоят отговор: <span className="text-[#F87171] font-semibold uppercase">{yourAnswer || "—"}</span>
                                                {" · "}
                                                Верен: <span className="text-[#4ADE80] font-semibold uppercase">{correct}</span>
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <Link
                        href="/"
                        className="mt-10 inline-block font-display font-bold text-sm bg-[#F2C14E] text-[#0B0E1A] px-6 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                    >
                        Обратно към началото →
                    </Link>
                </section>
            </div>
        );
    }

    // --- ВЪПРОС (с навигация назад/напред) ---
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

    return (
        <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen relative overflow-hidden">
            <div className="starfield" />
            <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#4FD1C5] opacity-[0.07] blur-[100px]" />
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-[#A78BFA] opacity-[0.08] blur-[100px]" />

            <nav className="relative z-10 max-w-3xl mx-auto px-6 py-6">
                <Link href="/" className="font-display text-xl font-bold tracking-wide">
                    bg<span className="text-[#4FD1C5]">научи</span>
                </Link>
            </nav>

            <section className="relative z-10 max-w-2xl mx-auto px-6 pt-4 pb-16">
                <p className="text-[#9CA3C4] text-sm mb-3">{exam.title} · {exam.grade}. клас</p>

                {/* Прогрес — клик за директен скок до посетен въпрос */}
                <div className="flex items-center gap-2 mb-8">
                    {exam.questions.map((qq, i) => {
                        const visited = i <= furthest;
                        return (
                            <button
                                key={qq.id}
                                onClick={() => visited && setCurrentIndex(i)}
                                disabled={!visited}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i === currentIndex
                                        ? "bg-[#F2C14E]"
                                        : answers[String(qq.id)]
                                        ? "bg-[#4FD1C5]"
                                        : "bg-white/10"
                                } ${visited ? "cursor-pointer" : "cursor-default"}`}
                            />
                        );
                    })}
                </div>
                <p className="font-mono text-xs text-[#9CA3C4] mb-6">
                    Въпрос {currentIndex + 1} от {exam.questions.length}
                </p>

                <div key={q.id} className="bg-[#141833] border border-white/10 rounded-3xl p-6 md:p-8">
                    <p className="font-display font-bold text-lg mb-6">
                        {renderTextWithMath(q.text)}
                    </p>
                    {q.image && (
                        <div className="mb-6 flex justify-center">
                            <img
                                src={q.image}
                                alt={`Фигура към въпрос ${currentIndex + 1}`}
                                className="max-w-full max-h-80 rounded-xl bg-[#EDEFF7] p-4"
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {options.map(([key, label]) => {
                            let style = "border-2 border-white/10 bg-[#0B0E1A] hover:border-[#4FD1C5]/50";
                            if (selected === key) {
                                style = "border-2 border-[#F2C14E] bg-[#F2C14E]/10";
                            }
                            return (
                                <button
                                    key={key}
                                    onClick={() => selectAnswer(q.id, key)}
                                    className={`${style} rounded-2xl px-4 py-3 text-left transition-all duration-200`}
                                >
                                    <span className="font-semibold uppercase mr-2 font-mono">{key})</span>
                                    {renderTextWithMath(label)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Навигация */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={goBack}
                        disabled={currentIndex === 0}
                        className="font-display text-sm font-medium px-5 py-3 rounded-full border border-white/10 hover:border-[#4FD1C5]/50 transition-colors disabled:opacity-30 disabled:hover:border-white/10"
                    >
                        ← Назад
                    </button>

                    {isLast ? (
                        <button
                            onClick={submitAnswers}
                            disabled={!allAnswered || submitting}
                            className="font-display font-bold text-sm bg-[#F2C14E] text-[#0B0E1A] px-6 py-3 rounded-full hover:scale-105 transition-transform duration-300 disabled:opacity-40 disabled:hover:scale-100"
                        >
                            {submitting ? "Проверяваме..." : "Провери резултата"}
                        </button>
                    ) : (
                        <button
                            onClick={goNext}
                            disabled={currentIndex > furthest}
                            className="font-display text-sm font-medium px-5 py-3 rounded-full border border-white/10 hover:border-[#4FD1C5]/50 transition-colors disabled:opacity-30 disabled:hover:border-white/10"
                        >
                            Напред →
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}