"use client";

import { useState } from "react";
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
                <h2 className="mb-1 font-display text-2xl font-extrabold">Вход</h2>
                <p className="mb-7 text-ink-soft">Влез в профила си</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="username" className="mb-1.5 block font-display text-sm font-semibold">
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
                        <label htmlFor="password" className="mb-1.5 block font-display text-sm font-semibold">
                            Парола
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field !pr-24"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-sm font-semibold text-ink-soft hover:text-ink bg-transparent border-none cursor-pointer"
                            >
                                {showPassword ? "Скрий" : "Покажи"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p
                            key={errorCount}
                            role="alert"
                            className="shake rounded-xl border-2 border-pen bg-pen-tint px-4 py-3 font-display text-sm font-semibold text-pen"
                        >
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading} className="btn w-full">
                        {loading ? "Влизаме…" : "Влез"}
                    </button>
                </form>

                <p className="mt-7 text-center text-ink-soft">
                    Нямаш профил?{" "}
                    <Link href="/register" className="marker-line font-display font-bold text-cobalt-deep">
                        Регистрирай се
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
