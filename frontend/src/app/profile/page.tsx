"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { useAuthName } from "@/lib/useAuth";
import { apiFetch } from "@/lib/api";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";

type Attempt = {
    id: number;
    exam: number;
    exam_title: string;
    score: number | null;
    total_questions: number | null;
    completed_at: string;
};

function pctOf(a: Attempt) {
    return a.total_questions ? Math.round(((a.score ?? 0) / a.total_questions) * 100) : 0;
}

function MiniRing({ pct }: { pct: number }) {
    const r = 17;
    const c = 2 * Math.PI * r;
    return (
        <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0 -rotate-90" aria-hidden="true">
            <circle cx="22" cy="22" r={r} fill="none" stroke="#E8EDFF" strokeWidth="6" />
            <circle
                cx="22"
                cy="22"
                r={r}
                fill="none"
                stroke={pct >= 50 ? "#2B50E6" : "#C92A43"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - pct / 100)}
            />
        </svg>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const username = useAuthName();
    const [barsReady, setBarsReady] = useState(false);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login");
            return;
        }

        apiFetch("/api/attempts/")
            .then(async (res) => {
                if (!res.ok) {
                    router.push("/login");
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setAttempts(data);
                } else if (Array.isArray(data?.results)) {
                    setAttempts(data.results);
                } else {
                    setAttempts([]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    useEffect(() => {
        if (loading) return;
        const id = requestAnimationFrame(() => setBarsReady(true));
        return () => cancelAnimationFrame(id);
    }, [loading]);

    const sorted = useMemo(
        () => [...attempts].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()),
        [attempts]
    );

    const stats = useMemo(() => {
        if (attempts.length === 0) return null;
        const pcts = attempts.map(pctOf);
        return {
            count: attempts.length,
            avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
            best: Math.max(...pcts),
        };
    }, [attempts]);

    const chart = useMemo(() => sorted.slice(0, 10).reverse(), [sorted]);

    if (loading) {
        return (
            <>
                <Nav />
                <Loader />
            </>
        );
    }

    return (
        <>
            <Nav />

            <main className="mx-auto max-w-6xl px-5 pb-24 pt-2">
                <div className="max-w-3xl">
                <header className="mb-10">
                    <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                        Здравей, {username}
                    </h1>
                    <p className="mt-2 font-hand text-[1.7rem] font-semibold leading-none text-cobalt-deep">
                        Ето как върви подготовката ти
                    </p>
                </header>

                {!stats ? (
                    <div className="sheet mx-auto max-w-xl border-dashed p-10 text-center">
                        <p className="mb-2 font-display text-xl font-bold">Още нямаш решени тестове</p>
                        <p className="mb-7 text-ink-soft">Реши първия и резултатът ще се покаже тук.</p>
                        <Link href="/#klas-map" className="btn">
                            Избери клас
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-10 grid gap-5 sm:grid-cols-3">
                            {[
                                { label: "Решени теста", value: String(stats.count), bg: "#E4EAFF" },
                                { label: "Среден резултат", value: `${stats.avg}%`, bg: "#FFF4BF" },
                                { label: "Най-добър резултат", value: `${stats.best}%`, bg: "#D8F5E8" },
                            ].map((s, i) => (
                                <div
                                    key={s.label}
                                    className="sheet drop-in p-5"
                                    style={{ background: s.bg, "--i": i, "--r": i === 1 ? "2deg" : "-2deg" } as CSSProperties}
                                >
                                    <div className="font-display text-4xl font-extrabold leading-none">{s.value}</div>
                                    <div className="mt-2 font-display text-sm font-semibold text-ink-soft">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {chart.length > 1 && (
                            <section className="sheet mb-10 p-5 sm:p-7" aria-label="Последни резултати">
                                <h2 className="mb-5 font-display text-lg font-bold">Последните ти резултати</h2>
                                <div className="relative flex h-40 items-end gap-2 sm:gap-3">
                                    <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-dashed border-ink/15" aria-hidden="true" />
                                    {chart.map((a, i) => {
                                        const p = pctOf(a);
                                        return (
                                            <div
                                                key={a.id}
                                                className="relative flex h-full flex-1 items-end"
                                                title={`${a.exam_title}: ${p}%`}
                                            >
                                                <div
                                                    className={`w-full rounded-t-lg border-2 border-ink ${p >= 50 ? "bg-cobalt" : "bg-pen"} ${
                                                        i === chart.length - 1 ? "!bg-marker" : ""
                                                    }`}
                                                    style={{
                                                        height: barsReady ? `${Math.max(p, 4)}%` : "0%",
                                                        transition: `height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${0.15 + i * 0.07}s`,
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="mt-3 font-display text-xs text-ink-soft">
                                    Жълтата колона е последният ти тест. Пунктирът е 50%.
                                </p>
                            </section>
                        )}

                        <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">История</h2>
                        <ul className="space-y-4">
                            {sorted.map((a, i) => {
                                const p = pctOf(a);
                                return (
                                    <li
                                        key={a.id}
                                        className="sheet drop-in flex items-center gap-4 p-4 sm:gap-5 sm:p-5"
                                        style={{ "--i": Math.min(i, 8), "--r": "-1deg" } as CSSProperties}
                                    >
                                        <MiniRing pct={p} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-display font-bold">{a.exam_title}</p>
                                            <p className="text-sm text-ink-soft">
                                                {new Date(a.completed_at).toLocaleDateString("bg-BG", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-display text-xl font-extrabold leading-none">
                                                {a.score} / {a.total_questions}
                                            </div>
                                            <div className="mt-1 font-display text-sm font-semibold text-ink-soft">{p}%</div>
                                        </div>
                                        <Link
                                            href={`/test/${a.exam}`}
                                            className="btn btn-sm btn-white hidden sm:inline-flex"
                                            aria-label={`Реши отново: ${a.exam_title}`}
                                        >
                                            Реши пак
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
                </div>
            </main>
        </>
    );
}
