"use client";

import { useEffect, useState } from "react";
import MathText from "@/components/MathText";

const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

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
            <div className="sheet p-6 sm:p-9">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="rounded-lg bg-blue-50 px-3 py-1 font-display text-xs font-extrabold uppercase text-blue-700">
                        🔥 Задача на деня • {data.grade}. клас
                    </span>
                    {q.topic && (
                        <span className="font-display text-xs font-bold text-slate-500">
                            Тема: {q.topic}
                        </span>
                    )}
                </div>

                <div className="mb-6 text-xl font-bold leading-relaxed text-slate-950 sm:text-2xl">
                    <MathText text={q.text} />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                    {(["a", "b", "c", "d"] as const).map((key) => {
                        const isChosen = selected === key;
                        const isCorrect = checkRes?.correct_option === key;
                        let style = "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50";
                        if (checkRes) {
                            if (isCorrect) style = "border-emerald-600 bg-emerald-50/80 text-emerald-950";
                            else if (isChosen) style = "border-red-500 bg-red-50/80 text-red-950";
                        }

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSelect(key)}
                                className={`flex items-center gap-3.5 rounded-xl border p-4 text-left font-display font-semibold transition ${style}`}
                            >
                                <span
                                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                                        checkRes && isCorrect
                                            ? "bg-emerald-600 text-white"
                                            : checkRes && isChosen
                                            ? "bg-red-600 text-white"
                                            : "bg-slate-100 text-slate-800"
                                    }`}
                                >
                                    {optionLetter[key]}
                                </span>
                                <span className="flex-1 text-base">
                                    <MathText text={q[`option_${key}`]} />
                                </span>
                            </button>
                        );
                    })}
                </div>

                {checkRes && (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className={`font-display text-sm font-extrabold ${checkRes.is_correct ? "text-emerald-700" : "text-red-600"}`}>
                            {checkRes.is_correct
                                ? "✓ Верен отговор!"
                                : `✕ Грешен отговор. Верният е ${optionLetter[checkRes.correct_option]}.`}
                        </p>
                        {checkRes.explanation && (
                            <div className="mt-2 text-sm leading-relaxed text-slate-700">
                                <strong>Решение: </strong>
                                <MathText text={checkRes.explanation} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}