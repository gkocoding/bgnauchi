"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import Nav from "@/components/Nav";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

function renderMath(text: string) {
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

export default function HomeworkPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState(searchParams.get("code") || "");
    const [homework, setHomework] = useState<any | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login?next=/homework");
            return;
        }
        const initialCode = searchParams.get("code");
        if (initialCode) {
            loadHomework(initialCode);
        }
    }, [router, searchParams]);

    async function loadHomework(targetCode: string) {
        const clean = targetCode.trim().toUpperCase();
        if (!clean) return;
        setLoading(true);
        setErrorMsg(null);
        const res = await apiFetch(`/api/homework/${clean}/`);
        setLoading(false);
        if (!res.ok) {
            setErrorMsg("Не е намерено задание с този код. Провери кода от твоя учител.");
            return;
        }
        const data = await res.json();
        setHomework(data);
        setAnswers({});
        setResult(null);
    }

    async function submitHomework() {
        if (!homework) return;
        const res = await apiFetch(`/api/homework/${homework.code}/`, {
            method: "POST",
            body: JSON.stringify({ answers }),
        });
        if (res.ok) {
            const data = await res.json();
            setResult(data);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setErrorMsg("Възникна грешка при предаване на домашното.");
        }
    }

    return (
        <>
            <Nav />
            <main className="mx-auto max-w-3xl px-5 pb-24 pt-4">
                <h1 className="font-display text-4xl font-extrabold tracking-tight">📝 Домашна работа</h1>
                <p className="mt-2 mb-8 font-hand text-[1.7rem] font-semibold text-cobalt-deep">
                    Въведи кода от своя учител и реши заданието
                </p>

                {errorMsg && (
                    <div className="sheet mb-6 border-pen bg-pen-tint p-4 font-display text-sm font-bold text-pen">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {!homework ? (
                    <div className="sheet max-w-md bg-[#FFF4BF] p-6 sm:p-8">
                        <label className="mb-2 block font-display text-sm font-extrabold">
                            Код на заданието (6 символа):
                        </label>
                        <input
                            type="text"
                            placeholder="напр. A7K9P2"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="mb-4 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-display text-lg font-extrabold uppercase tracking-widest"
                        />
                        <button
                            type="button"
                            onClick={() => loadHomework(code)}
                            disabled={loading || !code.trim()}
                            className="btn w-full"
                        >
                            {loading ? "Зареждане..." : "Отвори заданието"}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="sheet mb-6 flex flex-wrap items-center justify-between gap-4 bg-[#E4EAFF] p-5">
                            <div>
                                <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5 font-display text-xs font-extrabold">
                                    Код: {homework.code} • {homework.grade}. клас
                                </span>
                                <h2 className="mt-2 font-display text-2xl font-extrabold">{homework.title}</h2>
                                <p className="text-xs font-semibold text-ink-soft">
                                    Преподавател: {homework.teacher}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHomework(null)}
                                className="btn btn-sm btn-white"
                            >
                                Смени кода
                            </button>
                        </div>

                        {result ? (
                            <div className="sheet mb-8 bg-[#D8F5E8] p-6 sm:p-8 text-center">
                                <p className="font-hand text-5xl font-bold text-cobalt-deep">
                                    Предадено успешно!
                                </p>
                                <p className="mt-3 font-display text-2xl font-extrabold">
                                    Резултат: {result.score} / {result.total} ({result.pct}%)
                                </p>
                                <p className="mt-2 inline-block rounded-xl border-2 border-ink bg-[#FFF4BF] px-4 py-1.5 font-display text-base font-extrabold">
                                    Оценка по МОН: {result.mon_grade.toFixed(2)}
                                </p>
                                <p className="mt-3 text-sm text-ink-soft">
                                    Твоят учител ({homework.teacher}) вече вижда резултата ти в своето табло.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {homework.questions.map((q: any, i: number) => (
                                    <div key={q.id} className="sheet p-5 sm:p-7">
                                        <p className="mb-1 font-display text-xs font-bold text-ink-soft">
                                            Въпрос {i + 1} от {homework.questions.length}
                                        </p>
                                        <p className="mb-4 text-lg font-bold leading-snug">
                                            {renderMath(q.text)}
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {(["a", "b", "c", "d"] as const).map((opt) => {
                                                const sel = answers[String(q.id)] === opt;
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() =>
                                                            setAnswers((prev) => ({ ...prev, [String(q.id)]: opt }))
                                                        }
                                                        className={`flex items-center gap-3 rounded-2xl border-2 border-ink px-4 py-3 text-left font-display text-sm font-semibold transition ${
                                                            sel
                                                                ? "bg-cobalt text-white shadow-pop-sm -translate-y-0.5"
                                                                : "bg-white hover:bg-paper"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-extrabold ${
                                                                sel ? "bg-white text-ink" : "bg-paper"
                                                            }`}
                                                        >
                                                            {optionLetter[opt]}
                                                        </span>
                                                        <span>{renderMath(q[`option_${opt}`])}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={submitHomework}
                                    disabled={Object.keys(answers).length < homework.questions.length}
                                    className="btn btn-blue w-full"
                                >
                                    Предай домашната работа на учителя
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}