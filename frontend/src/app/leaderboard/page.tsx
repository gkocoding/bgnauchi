"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

type StudentRow = {
    username: string;
    school: string | null;
    city: string | null;
    total_points: number;
    tests_count: number;
};

type SchoolRow = {
    school: string;
    city: string | null;
    total_points: number;
    tests_count: number;
};

export default function LeaderboardPage() {
    const [tab, setTab] = useState<"students" | "schools">("students");
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [schools, setSchools] = useState<SchoolRow[]>([]);
    const [schoolName, setSchoolName] = useState("");
    const [city, setCity] = useState("");
    const [savedMsg, setSavedMsg] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadLeaderboard = () => {
        apiFetch("/api/leaderboard/")
            .then((r) => r.json())
            .then((data) => {
                setStudents(data.students || []);
                setSchools(data.schools || []);
                if (data.my_profile) {
                    setSchoolName(data.my_profile.school_name || "");
                    setCity(data.my_profile.city || "");
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadLeaderboard();
    }, []);

    async function saveSchool(e: React.FormEvent) {
        e.preventDefault();
        const res = await apiFetch("/api/leaderboard/", {
            method: "POST",
            body: JSON.stringify({ school_name: schoolName, city }),
        });
        if (res.ok) {
            setSavedMsg(true);
            loadLeaderboard();
            setTimeout(() => setSavedMsg(false), 2500);
        }
    }

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
            <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
                <header className="mb-8">
                    <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                        🏆 Национална класация
                    </h1>
                    <p className="mt-2 font-hand text-[1.7rem] font-semibold text-cobalt-deep">
                        Премери сили с ученици и училища от цяла България
                    </p>
                </header>

                {isLoggedIn() && (
                    <form onSubmit={saveSchool} className="sheet mb-8 bg-[#FFF4BF] p-5 sm:p-6">
                        <p className="mb-3 font-display text-sm font-extrabold">
                            🏫 Добави своето училище, за да му носиш точки с всеки решен тест:
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                placeholder="Училище (напр. СМГ, НПМГ, 1. СУ)"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="flex-1 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-display text-sm font-semibold"
                            />
                            <input
                                type="text"
                                placeholder="Град (напр. София)"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="sm:w-48 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-display text-sm font-semibold"
                            />
                            <button type="submit" className="btn shrink-0">
                                {savedMsg ? "✓ Запазено!" : "Запази"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mb-6 flex gap-3">
                    <button
                        type="button"
                        onClick={() => setTab("students")}
                        className={`btn ${tab === "students" ? "" : "btn-white"}`}
                    >
                        👩‍🎓 Топ Ученици
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("schools")}
                        className={`btn ${tab === "schools" ? "" : "btn-white"}`}
                    >
                        🏫 Топ Училища
                    </button>
                </div>

                {tab === "students" ? (
                    <div className="sheet overflow-hidden p-0">
                        <ul className="divide-y-2 divide-ink/15">
                            {students.map((st, idx) => (
                                <li key={st.username} className="flex items-center justify-between gap-4 px-5 py-4">
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ink font-display text-sm font-extrabold ${
                                                idx === 0
                                                    ? "bg-[#FFD93D]"
                                                    : idx === 1
                                                    ? "bg-[#E4EAFF]"
                                                    : idx === 2
                                                    ? "bg-[#FFE4E8]"
                                                    : "bg-white"
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-display font-bold">{st.username}</p>
                                            <p className="text-xs text-ink-soft">
                                                {st.school ? `${st.school}${st.city ? `, ${st.city}` : ""}` : "Без избрано училище"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-display text-lg font-extrabold text-cobalt-deep">
                                            {Math.round(st.total_points || 0)} т.
                                        </p>
                                        <p className="font-display text-xs text-ink-soft">{st.tests_count} теста</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="sheet overflow-hidden p-0">
                        {schools.length === 0 ? (
                            <p className="p-8 text-center text-ink-soft">
                                Бъди първият, който ще запише училището си в класацията!
                            </p>
                        ) : (
                            <ul className="divide-y-2 divide-ink/15">
                                {schools.map((sc, idx) => (
                                    <li key={sc.school} className="flex items-center justify-between gap-4 px-5 py-4">
                                        <div className="flex items-center gap-4">
                                            <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-[#D8F5E8] font-display text-sm font-extrabold">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-display font-bold">{sc.school}</p>
                                                {sc.city && <p className="text-xs text-ink-soft">{sc.city}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-display text-lg font-extrabold">
                                                {Math.round(sc.total_points || 0)} т.
                                            </p>
                                            <p className="font-display text-xs text-ink-soft">{sc.tests_count} решени теста</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}