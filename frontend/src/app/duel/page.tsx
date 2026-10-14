"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import Nav from "@/components/Nav";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

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
                const errText = await res.text();
                setErrorMsg(`Грешка от сървъра (${res.status}): Провери дали си пуснал миграциите и urls.py. ${errText.slice(0, 120)}`);
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
            <main className="mx-auto max-w-3xl px-5 pb-24 pt-4">
                <h1 className="font-display text-4xl font-extrabold tracking-tight">⚔️ 1v1 Дуел с приятел</h1>
                <p className="mt-2 mb-8 font-hand text-[1.7rem] font-semibold text-cobalt-deep">
                    5 бързи въпроса — побеждава по-точният и по-бързият!
                </p>

                {errorMsg && (
                    <div className="sheet mb-6 border-pen bg-pen-tint p-4 font-display text-sm font-bold text-pen">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {!duelData ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sheet bg-[#FFF4BF] p-6">
                            <h2 className="mb-3 font-display text-xl font-extrabold">Създай нов дуел</h2>
                            <label className="mb-2 block font-display text-xs font-bold">Избери клас:</label>
                            <div className="mb-5 flex gap-2">
                                {[4, 7, 10, 12].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGrade(g)}
                                        className={`flex-1 rounded-xl border-2 border-ink py-2 font-display font-extrabold ${
                                            grade === g ? "bg-cobalt text-white" : "bg-white"
                                        }`}
                                    >
                                        {g}.
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={createDuel} disabled={busy} className="btn w-full">
                                {busy ? "Създаване..." : "Генерирай код за дуел"}
                            </button>
                        </div>

                        <div className="sheet p-6">
                            <h2 className="mb-3 font-display text-xl font-extrabold">Влез с код от приятел</h2>
                            <input
                                type="text"
                                placeholder="Въведи 6-цифрен код..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="mb-4 w-full rounded-xl border-2 border-ink bg-paper px-4 py-2.5 font-display font-bold uppercase"
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
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink bg-[#E4EAFF] p-4">
                            <div>
                                <p className="font-display text-xs font-bold text-ink-soft">КОД ЗА ПРИЯТЕЛ:</p>
                                <p className="font-display text-2xl font-extrabold tracking-widest">{duelData.code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(duelData.code)}
                                className="btn btn-sm btn-white"
                            >
                                📋 Копирай кода
                            </button>
                        </div>

                        {result ? (
                            <div className="py-6 text-center">
                                <p className="font-hand text-5xl font-bold text-cobalt-deep">
                                    Твоят резултат: {result.score} / {result.total}
                                </p>
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border-2 border-ink bg-[#FFF4BF] p-4">
                                        <p className="font-display text-xs font-bold">Създател ({duelData.creator})</p>
                                        <p className="font-display text-2xl font-extrabold">
                                            {result.creator_score !== null ? `${result.creator_score} т.` : "Още решава..."}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border-2 border-ink bg-[#D8F5E8] p-4">
                                        <p className="font-display text-xs font-bold">Опонент</p>
                                        <p className="font-display text-2xl font-extrabold">
                                            {result.opponent_score !== null ? `${result.opponent_score} т.` : "Очаква се приятел..."}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-center gap-3">
                                    <button type="button" onClick={() => loadDuel(duelData.code)} className="btn btn-white">
                                        🔄 Обнови резултата
                                    </button>
                                    <button type="button" onClick={() => setDuelData(null)} className="btn">
                                        Нов дуел
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {duelData.questions.map((q: any, i: number) => (
                                    <div key={q.id} className="rounded-2xl border-2 border-ink bg-white p-5">
                                        <p className="mb-3 font-display font-bold">
                                            {i + 1}. {renderMath(q.text)}
                                        </p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {(["a", "b", "c", "d"] as const).map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setAnswers((p) => ({ ...p, [String(q.id)]: opt }))}
                                                    className={`rounded-xl border-2 border-ink px-3 py-2 text-left font-display text-sm font-semibold ${
                                                        answers[String(q.id)] === opt ? "bg-cobalt text-white" : "bg-paper"
                                                    }`}
                                                >
                                                    {opt.toUpperCase()}) {renderMath(q[`option_${opt}`])}
                                                </button>
                                            ))}
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