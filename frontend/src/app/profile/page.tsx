"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUsername, logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type Attempt = {
    id: number;
    exam: number;
    exam_title: string;
    score: number | null;
    total_questions: number | null;
    completed_at: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login");
            return;
        }

        setUsername(getUsername());

        apiFetch("/api/attempts/")
            .then((res) => res.json())
            .then((data) => {
                setAttempts(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    function handleLogout() {
        logout();
        router.push("/");
    }

    if (loading) {
        return (
            <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen flex items-center justify-center">
                <p className="font-display text-sm text-[#9CA3C4]">Зареждане...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen relative overflow-hidden">
            <div className="starfield" />
            <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#4FD1C5] opacity-[0.07] blur-[100px]" />
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-[#A78BFA] opacity-[0.08] blur-[100px]" />

            <nav className="relative z-10 max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
                <Link href="/" className="font-display text-xl font-bold tracking-wide">
                    bg<span className="text-[#4FD1C5]">научи</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="text-[#9CA3C4] text-sm font-medium px-3 hover:text-[#EDEFF7] transition-colors"
                >
                    Изход
                </button>
            </nav>

            <section className="relative z-10 max-w-3xl mx-auto px-6 pt-6 pb-16">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F2C14E] mb-4 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E] pulse-node" />
                    ТВОЯТА ОРБИТА
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">
                    Здравей, {username}
                </h1>
                <p className="text-[#9CA3C4] mb-10">Твоята история от решени тестове</p>

                {attempts.length === 0 ? (
                    <div className="bg-[#141833] border border-white/10 rounded-3xl p-8 text-center">
                        <p className="text-[#9CA3C4] mb-5 text-sm">Все още нямаш решени тестове.</p>
                        <Link
                            href="/"
                            className="inline-block font-display font-bold text-sm bg-[#F2C14E] text-[#0B0E1A] px-6 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                        >
                            Реши първия си тест →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attempts.map((a) => (
                            <div
                                key={a.id}
                                className="bg-[#141833] border border-white/10 rounded-3xl p-6 flex items-center justify-between hover:border-[#4FD1C5]/30 transition-colors"
                            >
                                <div>
                                    <p className="font-display font-bold">{a.exam_title}</p>
                                    <p className="text-[#9CA3C4] text-xs mt-1">
                                        {new Date(a.completed_at).toLocaleDateString("bg-BG", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="font-mono text-xl font-bold text-[#4FD1C5]">
                                    {a.score} / {a.total_questions}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}