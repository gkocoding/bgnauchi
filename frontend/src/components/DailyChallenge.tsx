"use client";

import { useEffect, useState } from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

function renderMathText(text: string) {
    if (!text) return null;
    const parts = text.split(/(\\[a-zA-Z]+(?:\{[^{}]*\})*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("\\")) {
            try {
                return <InlineMath key={idx} math={part} />;
            } catch {
                return <span key={idx}>{part}</span>;
            }
        }
        return <span key={idx}>{part}</span>;
    });
}

export default function DailyChallenge() {
    const [data, setData] = useState<any | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [checkRes, setCheckRes] = useState<{
        is_correct: boolean;
        correct_option: string;
        explanation: string;
    } | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/daily-challenge/`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d?.question) setData(d);
            })
            .catch(() => {});
    }, []);

    if (!data?.question) return null;
    const q = data.question;

    async function handleSelect(opt: string) {
        if (checkRes) return;
        setSelected(opt);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/daily-challenge/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question_id: q.id, answer: opt }),
        });
        if (res.ok) {
            const json = await res.json();
            setCheckRes(json);
        }
    }

    return (
        <section className="mx-auto max-w-6xl px-5 pb-16">
            <div className="sheet bg-[#FFF4BF] p-6 sm:p-9">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border-2 border-ink bg-white px-3.5 py-1 font-display text-xs font-extrabold uppercase">
                        🔥 Задача на деня • {data.grade}. клас
                    </span>
                    {q.topic && (
                        <span className="font-display text-xs font-bold text-ink-soft">
                            Тема: {q.topic}
                        </span>
                    )}
                </div>

                <p className="mb-6 text-xl font-bold leading-snug sm:text-2xl">
                    {renderMathText(q.text)}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                    {(["a", "b", "c", "d"] as const).map((key) => {
                        const isChosen = selected === key;
                        const isCorrect = checkRes?.correct_option === key;
                        let style = "border-ink bg-white hover:-translate-y-0.5";
                        if (checkRes) {
                            if (isCorrect) style = "border-ok bg-ok-tint";
                            else if (isChosen) style = "border-pen bg-pen-tint";
                        }

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSelect(key)}
                                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-display font-semibold transition ${style}`}
                            >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper text-sm font-extrabold">
                                    {optionLetter[key]}
                                </span>
                                <span className="flex-1">{renderMathText(q[`option_${key}`])}</span>
                            </button>
                        );
                    })}
                </div>

                {checkRes && (
                    <div className="mt-5 rounded-2xl border-2 border-ink bg-white p-4">
                        <p className={`font-display text-base font-extrabold ${checkRes.is_correct ? "text-ok" : "text-pen"}`}>
                            {checkRes.is_correct
                                ? "🎉 Браво! Верен отговор!"
                                : `Грешен отговор. Верният е ${optionLetter[checkRes.correct_option]}.`}
                        </p>
                        {checkRes.explanation && (
                            <p className="mt-2 text-sm text-ink-soft">
                                <strong>Решение:</strong> {renderMathText(checkRes.explanation)}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}