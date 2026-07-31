"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, login } from "@/lib/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await register(username, email, password);

        if (!result.success) {
            setError(result.error || "Възникна грешка.");
            setLoading(false);
            return;
        }

        const loginResult = await login(username, password);
        setLoading(false);

        if (loginResult.success) {
            router.push("/profile");
        } else {
            router.push("/login");
        }
    }

    return (
        <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen relative overflow-hidden">
            <div className="starfield" />
            <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#4FD1C5] opacity-[0.07] blur-[100px]" />
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-[#A78BFA] opacity-[0.08] blur-[100px]" />

            <nav className="relative z-10 max-w-3xl mx-auto px-6 py-6">
                <Link href="/" className="font-display text-xl font-bold tracking-wide">
                    bg<span className="text-[#4FD1C5]">научи</span>
                </Link>
            </nav>

            <section className="relative z-10 max-w-md mx-auto px-6 py-10">
                <div className="bg-[#141833] border border-white/10 rounded-3xl p-8">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F2C14E] mb-4 tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E] pulse-node" />
                        НОВА ЗВЕЗДА
                    </div>
                    <h1 className="font-display text-2xl font-bold mb-2">Регистрация</h1>
                    <p className="text-[#9CA3C4] text-sm mb-8">
                        Създай си профил, за да пазиш резултатите си
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[#9CA3C4] mb-1.5">
                                Потребителско име
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#0B0E1A] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#4FD1C5]/60 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#9CA3C4] mb-1.5">
                                Имейл
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0B0E1A] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#4FD1C5]/60 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#9CA3C4] mb-1.5">
                                Парола
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0B0E1A] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#4FD1C5]/60 transition-colors"
                            />
                        </div>

                        {error && (
                            <p className="text-[#F87171] text-sm font-medium">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full font-display font-bold text-sm bg-[#F2C14E] text-[#0B0E1A] px-6 py-3.5 rounded-full hover:scale-[1.02] transition-transform duration-300 disabled:opacity-40 disabled:hover:scale-100"
                        >
                            {loading ? "Регистрираме те..." : "Регистрирай се"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#9CA3C4] mt-6">
                        Вече имаш профил?{" "}
                        <Link href="/login" className="text-[#4FD1C5] font-medium">
                            Влез оттук
                        </Link>
                    </p>
                </div>
            </section>
        </div>
    );
}