"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import MathText from "@/components/MathText";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

const optionLetter: Record<string, string> = { a: "А", b: "Б", c: "В", d: "Г" };

export default function DuelPage() {
    const router = useRouter();
    const [grade, setGrade] = useState(7);
    const [joinCode, setJoinCode] = useState("");
    const [duelData, setDuelData] = useState<any | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<any | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login?next=/duel");
        }
    }, [router]);

    async function createDuel() {
        setErrorMsg(null);
        setBusy(true);
        try {
            const res = await apiFetch("/api/duels/", {
                method: "POST",
                body: JSON.stringify({ grade }),
            });
            if (!res.ok) {
                setErrorMsg("Неуспешно създаване на дуел.");
                setBusy(false);
                return;
            }
            const data = await res.json();
            await loadDuel(data.code);
        } catch {
            setErrorMsg("Няма връзка със сървъра.");
        }
        setBusy(false);
    }

    async function loadDuel(codeToLoad: string) {
        setErrorMsg(null);
        const cleanCode = codeToLoad.trim().toUpperCase();
        if (!cleanCode) return;

        const res = await apiFetch(`/api/duels/${cleanCode}/`);
        if (!res.ok) {
            setErrorMsg("Дуел с такъв код не беше намерен.");
            return;
        }
        const data = await res.json();
        setDuelData(data);
        setAnswers({});
        setResult(null);
        setStartTime(Date.now());
    }

    async function submitDuel() {
        if (!duelData) return;
        const duration = Math.round((Date.now() - startTime) / 1000);
        const res = await apiFetch(`/api/duels/${duelData.code}/`, {
            method: "POST",
            body: JSON.stringify({ answers, duration_seconds: duration }),
        });
        if (res.ok) {
            const data = await res.json();
            setResult(data);
        } else {
            setErrorMsg("Грешка при предаване на дуела.");
        }
    }

    return (
        <>
            <Nav />
            <main className="mx-auto max-w-3xl px-5 pb-24 pt-6">
                <header className="mb-8">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-blue-600">
                        Състезателен режим в реално време
                    </span>
                    <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                        ⚔️ 1v1 Дуел с приятел
                    </h1>
                    <p className="mt-1 text-base text-slate-600">
                        Решете едни и същи 5 задачи за време и точност.
                    </p>
                </header>

                {errorMsg && (
                    <div className="sheet mb-6 border-red-300 bg-red-50 p-4 font-display text-sm font-bold text-red-700">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {!duelData ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sheet p-6 sm:p-7">
                            <h2 className="mb-2 font-display text-xl font-extrabold text-slate-950">
                                Създай нов дуел
                            </h2>
                            <p className="mb-4 text-xs text-slate-500">
                                Избери клас и изпрати генерирания код на приятел.
                            </p>
                            <div className="mb-6 flex gap-2">
                                {[4, 7, 10, 12].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGrade(g)}
                                        className={`flex-1 rounded-xl border py-2.5 font-display text-sm font-extrabold transition ${
                                            grade === g
                                                ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-900"
                                        }`}
                                    >
                                        {g}. клас
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={createDuel} disabled={busy} className="btn w-full">
                                {busy ? "Генериране..." : "Генерирай код за дуел"}
                            </button>
                        </div>

                        <div className="sheet p-6 sm:p-7">
                            <h2 className="mb-2 font-display text-xl font-extrabold text-slate-950">
                                Влез с код от приятел
                            </h2>
                            <p className="mb-4 text-xs text-slate-500">
                                Въведи 6-символния код, който ти е изпратен.
                            </p>
                            <input
                                type="text"
                                placeholder="КОД (напр. 8F4K2A)"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="field mb-4 font-bold uppercase tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => loadDuel(joinCode)}
                                disabled={!joinCode.trim()}
                                className="btn btn-white w-full"
                            >
                                Влез в дуела
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="sheet p-6 sm:p-8">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                            <div>
                                <p className="font-display text-[11px] font-bold uppercase text-blue-700">
                                    Код за покана на приятел
                                </p>
                                <p className="font-display text-2xl font-black tracking-widest text-slate-950">
                                    {duelData.code}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(duelData.code)}
                                className="btn btn-white btn-sm"
                            >
                                Копирай кода
                            </button>
                        </div>

                        {result ? (
                            <div className="py-6 text-center">
                                <p className="font-display text-3xl font-extrabold text-slate-950">
                                    Твоят резултат: {result.score} / {result.total}
                                </p>
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                        <p className="font-display text-xs font-bold text-slate-500">
                                            Създател ({duelData.creator})
                                        </p>
                                        <p className="mt-1 font-display text-2xl font-black text-slate-950">
                                            {result.creator_score !== null ? `${result.creator_score} т.` : "Още решава..."}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                        <p className="font-display text-xs font-bold text-slate-500">Опонент</p>
                                        <p className="mt-1 font-display text-2xl font-black text-blue-600">
                                            {result.opponent_score !== null ? `${result.opponent_score} т.` : "Очаква се приятел..."}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-center gap-3">
                                    <button type="button" onClick={() => loadDuel(duelData.code)} className="btn btn-white">
                                        Обнови резултата
                                    </button>
                                    <button type="button" onClick={() => setDuelData(null)} className="btn">
                                        Нов дуел
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {duelData.questions.map((q: any, i: number) => (
                                    <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
                                        <p className="mb-4 text-lg font-bold text-slate-950">
                                            <span className="mr-2 text-blue-600">{i + 1}.</span>
                                            <MathText text={q.text} />
                                        </p>
                                        <div className="grid gap-2.5 sm:grid-cols-2">
                                            {(["a", "b", "c", "d"] as const).map((opt) => {
                                                const sel = answers[String(q.id)] === opt;
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setAnswers((p) => ({ ...p, [String(q.id)]: opt }))}
                                                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left font-display text-sm font-semibold transition ${
                                                            sel
                                                                ? "border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600/20"
                                                                : "border-slate-200 bg-slate-50/60 text-slate-800 hover:border-slate-900"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                                                                sel ? "bg-blue-600 text-white" : "bg-white text-slate-700"
                                                            }`}
                                                        >
                                                            {optionLetter[opt]}
                                                        </span>
                                                        <span className="flex-1">
                                                            <MathText text={q[`option_${opt}`]} />
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={submitDuel} className="btn btn-blue w-full">
                                    Предай дуела
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}