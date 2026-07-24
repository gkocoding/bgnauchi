"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Question = {
    id: number;
    text: string;
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

export default function TestPage() {
    const params = useParams();
    const examId = params.id as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/`)
            .then((res) => res.json())
            .then((data) => {
                setExam(data);
                setLoading(false);
            });
    }, [examId]);

    function selectAnswer(questionId: number, option: string) {
        if (result) return;
        setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));
    }

    async function submitAnswers() {
        setSubmitting(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}/check/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
        });
        const data: CheckResult = await res.json();
        setResult(data);
        setSubmitting(false);
    }

    if (loading) {
        return (
            <div className="bg-[#20202B] text-[#FFF8F0] min-h-screen flex items-center justify-center">
                <p className="font-display text-xl">Зареждане...</p>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="bg-[#20202B] text-[#FFF8F0] min-h-screen flex items-center justify-center">
                <p className="font-display text-xl">Тестът не е намерен.</p>
            </div>
        );
    }

    const allAnswered = exam.questions.every((q) => answers[String(q.id)]);

    return (
        <div className="bg-[#20202B] text-[#FFF8F0] min-h-screen relative overflow-hidden">
            <div className="floaty absolute top-20 left-10 w-32 h-32 rounded-full bg-[#FFC857] opacity-20 blur-2xl"></div>
            <div className="floaty absolute bottom-40 right-1/4 w-40 h-40 rounded-full bg-[#5AC8D8] opacity-20 blur-2xl" style={{ animationDelay: "2s" }}></div>

            <nav className="relative z-10 max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
                <Link href="/" className="font-display text-2xl font-bold">
                    bg<span className="text-[#FF6B4A]">научи</span> 🎈
                </Link>
            </nav>

            <section className="relative z-10 max-w-3xl mx-auto px-6 pt-6 pb-16">
                <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2">{exam.title}</h1>
                <p className="text-[#B8B4AC] mb-10">{exam.grade}. клас · {exam.questions.length} въпроса</p>

                {result && (
                    <div className="bg-[#2A2A38] rounded-3xl p-8 text-center mb-10 shadow-md">
                        <div className="text-5xl mb-3">
                            {result.score === result.total ? "🎉" : result.score >= result.total / 2 ? "👍" : "💪"}
                        </div>
                        <div className="font-display text-3xl font-extrabold mb-1">
                            {result.score} / {result.total}
                        </div>
                        <p className="text-[#B8B4AC]">верни отговора</p>
                    </div>
                )}

                <div className="space-y-6">
                    {exam.questions.map((q, index) => {
                        const options: [string, string][] = [
                            ["a", q.option_a],
                            ["b", q.option_b],
                            ["c", q.option_c],
                            ["d", q.option_d],
                        ];
                        const selected = answers[String(q.id)];
                        const correct = result?.correct_answers[String(q.id)];

                        return (
                            <div key={q.id} className="bg-[#2A2A38] rounded-3xl p-6 shadow-md">
                                <p className="font-display font-bold text-lg mb-4">
                                    {index + 1}. {q.text}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {options.map(([key, label]) => {
                                        let style = "border-2 border-transparent bg-[#20202B] hover:border-[#5AC8D8]";

                                        if (result && correct) {
                                            if (key === correct) {
                                                style = "border-2 border-[#4CAF50] bg-[#20202B]";
                                            } else if (key === selected && key !== correct) {
                                                style = "border-2 border-[#E05A4A] bg-[#20202B]";
                                            }
                                        } else if (selected === key) {
                                            style = "border-2 border-[#FF6B4A] bg-[#20202B]";
                                        }

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => selectAnswer(q.id, key)}
                                                disabled={!!result}
                                                className={`${style} rounded-2xl px-4 py-3 text-left transition-all duration-200`}
                                            >
                                                <span className="font-semibold uppercase mr-2">{key})</span>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!result && (
                    <button
                        onClick={submitAnswers}
                        disabled={!allAnswered || submitting}
                        className="mt-10 w-full font-display font-bold text-lg bg-[#FF6B4A] text-white px-10 py-4 rounded-full shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100"
                    >
                        {submitting ? "Проверяваме..." : "Провери отговорите"}
                    </button>
                )}
            </section>
        </div>
    );
}