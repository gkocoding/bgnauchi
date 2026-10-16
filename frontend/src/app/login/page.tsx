"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { safeNext } from "@/lib/nav";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCount, setErrorCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "БГнаучи | Вход";
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await login(username, password);
        setLoading(false);

        if (!result.success) {
            setError(result.error || "Възникна грешка.");
            setErrorCount((c) => c + 1);
            return;
        }

        router.push(safeNext() ?? "/profile");
    }

    return (
        <AuthShell title="Здравей отново" pitch="Влез, за да продължиш оттам, откъдето спря, и да виждаш всичките си резултати.">
            <div className="sheet p-7 sm:p-9">
                <h2 className="mb-1 font-display text-2xl font-extrabold text-slate-950">Вход</h2>
                <p className="mb-7 text-sm text-slate-500">Влез в своя ученически или учителски профил</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="username" className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-slate-600">
                            Потребителско име
                        </label>
                        <input
                            id="username"
                            type="text"
                            required
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="field"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-slate-600">
                            Парола
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="off"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field !pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p
                            key={errorCount}
                            role="alert"
                            className="shake rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-display text-sm font-semibold text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading} className="btn w-full">
                        {loading ? "Влизаме…" : "Влез в профила"}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-600">
                    Нямаш профил?{" "}
                    <Link href="/register" className="font-display font-bold text-blue-600 hover:underline">
                        Регистрирай се
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}