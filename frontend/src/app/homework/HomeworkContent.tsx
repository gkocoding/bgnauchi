"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import Nav from "@/components/Nav";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

/* ---------- Пълен LaTeX Парсър (поддържа вложени \frac, \sqrt, /frac, ^, _) ---------- */

function normalizeMathTypos(input: string): string {
    return input.replace(
        /(^|[\s([{\-+*=])\/(frac|sqrt|cdot|times|pi|alpha|beta|gamma|sin|cos|tg|cotg|log|ln|le|ge|neq|pm|infty)\b/g,
        "$1\\$2"
    );
}

function readBraceGroup(str: string, start: number): [string, number] {
    let depth = 0;
    for (let j = start; j < str.length; j++) {
        if (str[j] === "{") depth++;
        else if (str[j] === "}") {
            depth--;
            if (depth === 0) return [str.slice(start, j + 1), j + 1];
        }
    }
    return [str.slice(start), str.length];
}

function readBracketGroup(str: string, start: number): [string, number] {
    let depth = 0;
    for (let j = start; j < str.length; j++) {
        if (str[j] === "[") depth++;
        else if (str[j] === "]") {
            depth--;
            if (depth === 0) return [str.slice(start, j + 1), j + 1];
        }
    }
    return [str.slice(start), str.length];
}

function renderMath(rawText: string | null | undefined): React.ReactNode {
    if (!rawText) return null;
    const text = normalizeMathTypos(String(rawText));

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

    while (i < text.length) {
        if (text.startsWith("$$", i)) { const end = text.indexOf("$$", i + 2);
            if (end !== -1) {
                flushBuffer();
                const expr = text.slice(i + 2, end).trim();
                try {
                    nodes.push(<BlockMath key={key++} math={expr} />);
                } catch {
                    nodes.push(<InlineMath key={key++} math={expr} />);
                }
                i = end + 2;
                continue;
            }
        }

        if (text[i] === "$" && text[i + 1] !== "$") {
            const end = text.indexOf("$", i + 1);
            if (end !== -1) {
                flushBuffer();
                const expr = text.slice(i + 1, end).trim();
                try {
                    nodes.push(<InlineMath key={key++} math={expr} />);
                } catch {
                    nodes.push(<span key={key++}>{expr}</span>);
                }
                i = end + 1;
                continue;
            }
        }

        if (text[i] === "\\" && /[a-zA-Z]/.test(text[i + 1] || "")) {
            let j = i + 1;
            while (j < text.length && /[a-zA-Z]/.test(text[j])) j++;
            let mathExpr = text.slice(i, j);

            if (text[j] === "[") {
                const [bGroup, nextIdx] = readBracketGroup(text, j);
                mathExpr += bGroup;
                j = nextIdx;
            }

            let groupsRead = 0;
            while (groupsRead < 3 && text[j] === "{") {
                const [group, nextIndex] = readBraceGroup(text, j);
                mathExpr += group;
                j = nextIndex;
                groupsRead++;
            }

            while (j < text.length && (text[j] === "^" || text[j] === "_")) {
                mathExpr += text[j];
                j++;
                if (text[j] === "{") {
                    const [subGroup, nextIndex] = readBraceGroup(text, j);
                    mathExpr += subGroup;
                    j = nextIndex;
                } else if (j < text.length && /[a-zA-Z0-9]/.test(text[j])) {
                    mathExpr += text[j];
                    j++;
                }
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

        if (/[a-zA-Z0-9)]/.test(text[i]) && (text[i + 1] === "^" || text[i + 1] === "_")) {
            let startVar = i;
            while (buffer.length > 0 && /[a-zA-Z0-9]/.test(buffer[buffer.length - 1])) {
                buffer = buffer.slice(0, -1);
                startVar--;
            }
            flushBuffer();

            let j = i + 1;
            while (j < text.length && (text[j] === "^" || text[j] === "_")) {
                j++;
                if (text[j] === "{") {
                    const [, nextIdx] = readBraceGroup(text, j);
                    j = nextIdx;
                } else {
                    while (j < text.length && /[a-zA-Z0-9\-+]/.test(text[j])) j++;
                }
            }
            const expr = text.slice(startVar, j);
            try {
                nodes.push(<InlineMath key={key++} math={expr} />);
            } catch {
                nodes.push(<span key={key++}>{expr}</span>);
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

/* ---------- Компонент ---------- */

export default function HomeworkContent() {
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
            <main className="mx-auto max-w-3xl px-5 pb-24 pt-6">
                <header className="mb-8">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-blue-600">
                        Училищни задания
                    </span>
                    <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                        Домашна работа
                    </h1>
                    <p className="mt-1 text-base text-slate-600">
                        Въведи 6-символния код от своя учител и реши възложените задачи.
                    </p>
                </header>

                {errorMsg && (
                    <div className="sheet mb-6 border-red-300 bg-red-50 p-4 font-display text-sm font-bold text-red-700">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {!homework ? (
                    <div className="sheet max-w-md p-6 sm:p-8">
                        <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-slate-500">
                            Код на заданието
                        </label>
                        <input
                            type="text"
                            placeholder="напр. A7K9P2"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="field mb-4 font-display text-lg font-extrabold uppercase tracking-widest"
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
                        <div className="sheet mb-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                            <div>
                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-display text-xs font-bold text-blue-700">
                                    Код: {homework.code} • {homework.grade}. клас
                                </span>
                                <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">
                                    {homework.title}
                                </h2>
                                <p className="mt-0.5 text-xs font-semibold text-slate-500">
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
                            <div className="sheet mb-8 p-8 text-center">
                                <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1 font-display text-xs font-bold text-emerald-700">
                                    Предадено успешно
                                </span>
                                <p className="mt-3 font-display text-3xl font-extrabold text-slate-950">
                                    Резултат: {result.score} / {result.total} ({result.pct}%)
                                </p>
                                <div className="mt-4 inline-block rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 font-display text-lg font-black text-emerald-900">
                                    Оценка по МОН: {result.mon_grade.toFixed(2)}
                                </div>
                                <p className="mt-4 text-sm text-slate-500">
                                    Твоят учител ({homework.teacher}) вече вижда резултата ти в своето табло.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {homework.questions.map((q: any, i: number) => (
                                    <div key={q.id} className="sheet p-6 sm:p-7">
                                        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                                            <span className="font-display text-xs font-bold text-slate-400">
                                                Въпрос {i + 1} от {homework.questions.length}
                                            </span>
                                            {q.topic && (
                                                <span className="font-display text-xs font-semibold text-blue-600">
                                                    {q.topic}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-5 text-lg font-bold leading-relaxed text-slate-950">
                                            {renderMath(q.text)}
                                        </div>

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
                                                        className={`flex items-center gap-3.5 rounded-xl border p-3.5 text-left font-display text-sm font-semibold transition ${
                                                            sel
                                                                ? "border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-600/20"
                                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-900 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                                                                sel
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-slate-100 text-slate-700"
                                                            }`}
                                                        >
                                                            {optionLetter[opt]}
                                                        </span>
                                                        <span className="flex-1">
                                                            {renderMath(q[`option_${opt}`])}
                                                        </span>
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