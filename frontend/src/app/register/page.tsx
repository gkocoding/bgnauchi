"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, login } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { safeNext } from "@/lib/nav";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [website, setWebsite] = useState(""); // honeypot - остава винаги празно за истински хора
    const [error, setError] = useState<string | null>(null);
    const [errorCount, setErrorCount] = useState(0);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await register(username, email, password, website);

        if (!result.success) {
            setError(result.error || "Възникна грешка.");
            setErrorCount((c) => c + 1);
            setLoading(false);
            return;
        }

        const loginResult = await login(username, password);
        setLoading(false);

        if (loginResult.success) {
            router.push(safeNext() ?? "/profile");
        } else {
            router.push("/login");
        }
    }

    return (
        <AuthShell title="Започни с профил" pitch="Безплатно е. Профилът пази всеки решен тест, за да виждаш как се подобряваш.">
            <div className="sheet p-7 sm:p-9">
                <h2 className="mb-1 font-display text-2xl font-extrabold">Регистрация</h2>
                <p className="mb-7 text-ink-soft">Създай си профил, за да пазиш резултатите си</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot - невидимо поле за хора, капан за ботове */}
                    <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                        <label htmlFor="website">Website</label>
                        <input
                            type="text"
                            id="website"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />
                    </div>

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
                        <label htmlFor="email" className="mb-1.5 block font-display text-sm font-semibold">
                            Имейл
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field !pr-24"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="marker-line absolute right-3 top-1/2 -translate-y-1/2 font-display text-sm font-semibold text-ink-soft hover:text-ink"
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
                        {loading ? "Регистрираме те…" : "Регистрирай се"}
                    </button>
                </form>

                <p className="mt-7 text-center text-ink-soft">
                    Вече имаш профил?{" "}
                    <Link href="/login" className="marker-line font-display font-bold text-cobalt-deep">
                        Влез оттук
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
