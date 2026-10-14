"use client";

import { useEffect, useMemo, useState } from "react";
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
    exam_grade?: number;
    score: number | null;
    total_questions: number | null;
    mon_grade?: number;
    completed_at: string;
};

type SkillItem = {
    topic: string;
    accuracy: number;
    total: number;
    correct: number;
};

type AnalyticsData = {
    skills: SkillItem[];
    streak_days: number;
    mistakes_count: number;
};

const GRADE_ROADMAPS: Record<number, { examName: string; targetScore: string; modules: string[] }> = {
    4: {
        examName: "НВО след 4. клас",
        targetScore: "Цел: 90+ точки",
        modules: ["Именовани числа и текстови задачи", "Геометрични фигури и обиколка", "Правопис и четене с разбиране"],
    },
    7: {
        examName: "НВО след 7. клас (Прием в гимназии)",
        targetScore: "Цел: Бал 450+ / 500",
        modules: ["Цели изрази и уравнения", "Планиметрия и еднакви триъгълници", "Текстови задачи (движение и работа)", "БЕЛ: Пунктуация и преразказ"],
    },
    10: {
        examName: "НВО след 10. клас",
        targetScore: "Цел: 75+ точки",
        modules: ["Квадратни уравнения и функции", "Тригонометрия и прогресии", "БЕЛ: Литературни направления и норми"],
    },
    12: {
        examName: "ДЗИ (Матура) в 12. клас",
        targetScore: "Цел: Отличен (5.50+)",
        modules: ["Екстремуми, производни и логаритми", "Стереометрия и комбинаторика", "БЕЛ: Езикови норми и аргументативен текст"],
    },
};

function pctOf(a: Attempt) {
    return a.total_questions ? Math.round(((a.score ?? 0) / a.total_questions) * 100) : 0;
}

export default function ProfilePage() {
    const router = useRouter();
    const username = useAuthName();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<number>(7);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "БГнаучи | Профил";
    }, []);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login");
            return;
        }

        const savedGrade = typeof window !== "undefined" ? localStorage.getItem("bgnauchi_grade") : null;
        if (savedGrade && [4, 7, 10, 12].includes(Number(savedGrade))) {
            setSelectedGrade(Number(savedGrade));
        }

        Promise.all([apiFetch("/api/attempts/"), apiFetch("/api/analytics/")])
            .then(async ([attRes, anaRes]) => {
                if (!attRes.ok) {
                    router.push("/login");
                    return;
                }
                const attData = await attRes.json();
                const list: Attempt[] = Array.isArray(attData)
                    ? attData
                    : Array.isArray(attData?.results)
                    ? attData.results
                    : [];
                setAttempts(list);

                if (!savedGrade && list.length > 0 && list[0].exam_grade) {
                    setSelectedGrade(list[0].exam_grade);
                }

                if (anaRes.ok) {
                    const anaData = await anaRes.json();
                    setAnalytics(anaData);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    function handleGradeChange(g: number) {
        setSelectedGrade(g);
        if (typeof window !== "undefined") {
            localStorage.setItem("bgnauchi_grade", String(g));
        }
    }

    const sorted = useMemo(
        () => [...attempts].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()),
        [attempts]
    );

    const stats = useMemo(() => {
        if (attempts.length === 0) {
            return { count: 0, avg: 0, best: 0, avgGrade: "—", solvedToday: 0 };
        }
        const pcts = attempts.map(pctOf);
        const grades = attempts.map((a) => a.mon_grade || 2 + (pctOf(a) / 100) * 4);
        const avgGrade = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
        const todayStr = new Date().toDateString();
        const solvedToday = attempts.filter((a) => new Date(a.completed_at).toDateString() === todayStr).length;

        return {
            count: attempts.length,
            avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
            best: Math.max(...pcts),
            avgGrade,
            solvedToday,
        };
    }, [attempts]);

    const badges = useMemo(() => {
        const streak = analytics?.streak_days || 0;
        const masteredTopics = (analytics?.skills || []).filter((s) => s.accuracy >= 80 && s.total >= 3).length;
        return [
            {
                id: "first_step",
                title: "Първи старт",
                desc: "Решен поне 1 изпитен тест",
                unlocked: stats.count >= 1,
                icon: "🎯",
            },
            {
                id: "streak_3",
                title: "Постоянство",
                desc: "3 последователни дни подготовка",
                unlocked: streak >= 3,
                icon: "🔥",
            },
            {
                id: "high_achiever",
                title: "Отличник по МОН",
                desc: "Резултат над 85% в изпитен тест",
                unlocked: stats.best >= 85,
                icon: "🏅",
            },
            {
                id: "topic_master",
                title: "Майстор на темите",
                desc: "Над 80% успеваемост в учебна тема",
                unlocked: masteredTopics >= 1,
                icon: "🧠",
            },
        ];
    }, [analytics, stats]);

    if (loading) {
        return (
            <>
                <Nav />
                <Loader />
            </>
        );
    }

    const activeRoadmap = GRADE_ROADMAPS[selectedGrade] || GRADE_ROADMAPS[7];
    const dailyGoalPct = Math.min(100, Math.round((stats.solvedToday / 2) * 100));

    return (
        <>
            <Nav />

            <main className="mx-auto max-w-6xl px-5 pb-24 pt-6">
                {/* ГОРЕН ХЕДЪР НА УЧЕНИЧЕСКИЯ ХЪБ */}
                <header className="mb-8 flex flex-col justify-between gap-6 border-b border-ink/10 pb-7 lg:flex-row lg:items-center">
                    <div>
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-[#1E40AF]">
                            Персонален учебен хъб
                        </span>
                        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Здравей, {username}
                        </h1>
                        <p className="mt-1 text-base text-ink-soft">
                            Следи усвояването на материала и поддържай дневния си ритъм на подготовка.
                        </p>
                    </div>

                    {/* Избор на целеви клас */}
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/15 bg-white p-1.5 shadow-sm">
                        <span className="px-3 font-display text-xs font-bold text-ink-soft">Моят клас:</span>
                        {[4, 7, 10, 12].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => handleGradeChange(g)}
                                className={`rounded-xl px-3.5 py-1.5 font-display text-xs font-extrabold transition ${
                                    selectedGrade === g
                                        ? "bg-[#1E40AF] text-white shadow-sm"
                                        : "text-ink-soft hover:bg-black/5 hover:text-ink"
                                }`}
                            >
                                {g}. клас
                            </button>
                        ))}
                    </div>
                </header>

                {/* ОСНОВНИ МЕТРИКИ (4 симетрични карти) */}
                <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Обобщени показатели">
                    <div className="sheet p-5">
                        <span className="font-display text-xs font-semibold text-ink-soft">Решени тестове</span>
                        <div className="mt-2 font-display text-3xl font-extrabold text-ink">{stats.count}</div>
                        <span className="mt-1 block text-xs text-ink-soft">Общо завършени опити</span>
                    </div>

                    <div className="sheet p-5">
                        <span className="font-display text-xs font-semibold text-ink-soft">Средна успеваемост</span>
                        <div className="mt-2 font-display text-3xl font-extrabold text-[#1E40AF]">{stats.avg}%</div>
                        <span className="mt-1 block text-xs text-ink-soft">Най-добър: {stats.best}%</span>
                    </div>

                    <div className="sheet p-5">
                        <span className="font-display text-xs font-semibold text-ink-soft">Средна оценка (МОН)</span>
                        <div className="mt-2 font-display text-3xl font-extrabold text-[#047857]">{stats.avgGrade}</div>
                        <span className="mt-1 block text-xs text-ink-soft">По шестобалната скала</span>
                    </div>

                    <div className="sheet p-5">
                        <span className="font-display text-xs font-semibold text-ink-soft">Дневен стрийк</span>
                        <div className="mt-2 flex items-baseline gap-2 font-display text-3xl font-extrabold text-amber-600">
                            <span>🔥 {analytics?.streak_days || 0}</span>
                            <span className="text-sm font-bold text-ink-soft">дни</span>
                        </div>
                        <span className="mt-1 block text-xs text-ink-soft">
                            Дневна цел: {stats.solvedToday}/2 теста днес
                        </span>
                    </div>
                </section>

                {/* ДВУКОЛОНЕН ГРИД: Път на подготовка + Анализ по теми */}
                <div className="mb-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    {/* Лява колона: Учебен път за избрания клас + Поправи грешките си */}
                    <div className="space-y-6">
                        <section className="sheet p-6 sm:p-7">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="rounded-md bg-[#EFF6FF] px-2.5 py-1 font-display text-xs font-bold text-[#1E40AF]">
                                        Активен план • {selectedGrade}. клас
                                    </span>
                                    <h2 className="mt-2 font-display text-xl font-extrabold text-ink">
                                        {activeRoadmap.examName}
                                    </h2>
                                </div>
                                <span className="font-display text-xs font-bold text-ink-soft">
                                    {activeRoadmap.targetScore}
                                </span>
                            </div>

                            <div className="mt-5 space-y-2.5">
                                {activeRoadmap.modules.map((mod, idx) => (
                                    <div
                                        key={mod}
                                        className="flex items-center justify-between rounded-xl border border-ink/10 bg-[#FAF8F5] px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-6 w-6 place-items-center rounded-full bg-white font-display text-xs font-bold text-ink shadow-sm">
                                                {idx + 1}
                                            </span>
                                            <span className="font-display text-sm font-semibold text-ink">{mod}</span>
                                        </div>
                                        <Link
                                            href={`/klas/${selectedGrade}`}
                                            className="font-display text-xs font-bold text-[#1E40AF] hover:underline"
                                        >
                                            Решавай →
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href={`/klas/${selectedGrade}`} className="btn">
                                    Отвори тестовете за {selectedGrade}. клас
                                </Link>
                                {analytics && analytics.mistakes_count > 0 && (
                                    <Link href="/test/mistakes" className="btn btn-white">
                                        🎯 Поправи грешките си ({analytics.mistakes_count})
                                    </Link>
                                )}
                            </div>
                        </section>

                        {/* Усвояване на материала по теми (Skill Mastery) */}
                        <section className="sheet p-6 sm:p-7">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="font-display text-lg font-extrabold text-ink">
                                        Усвояване по теми (Mastery)
                                    </h2>
                                    <p className="text-xs text-ink-soft">
                                        Автоматична разбивка на база твоите верни и грешни отговори
                                    </p>
                                </div>
                            </div>

                            {!analytics || analytics.skills.length === 0 ? (
                                <p className="rounded-xl bg-[#FAF8F5] p-5 text-sm text-ink-soft">
                                    Реши поне един тест, за да видиш графиката със силните и слабите си теми.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {analytics.skills.map((sk) => {
                                        const barColor =
                                            sk.accuracy >= 75
                                                ? "bg-[#047857]"
                                                : sk.accuracy >= 50
                                                ? "bg-amber-500"
                                                : "bg-[#B91C1C]";
                                        return (
                                            <div key={sk.topic}>
                                                <div className="mb-1.5 flex items-center justify-between font-display text-sm">
                                                    <span className="font-bold text-ink">{sk.topic}</span>
                                                    <span className="text-xs font-semibold text-ink-soft">
                                                        {sk.accuracy}% ({sk.correct}/{sk.total} верни)
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F3EFEA]">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                        style={{ width: `${Math.max(sk.accuracy, 4)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Дясна колона: Дневна цел + Значки (Badges) */}
                    <div className="space-y-6">
                        <section className="sheet p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-base font-extrabold text-ink">Дневен фокус</h2>
                                <span className="font-display text-xs font-bold text-[#1E40AF]">{dailyGoalPct}%</span>
                            </div>
                            <p className="mt-1 text-xs text-ink-soft">
                                Решавай поне по 2 кратки теста на ден за трайна памет преди изпита.
                            </p>
                            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#F3EFEA]">
                                <div
                                    className="h-full rounded-full bg-[#1E40AF] transition-all duration-500"
                                    style={{ width: `${Math.max(dailyGoalPct, 6)}%` }}
                                />
                            </div>
                        </section>

                        <section className="sheet p-6">
                            <h2 className="mb-4 font-display text-base font-extrabold text-ink">
                                Значки и постижения
                            </h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {badges.map((b) => (
                                    <div
                                        key={b.id}
                                        className={`flex items-center gap-3.5 rounded-xl border p-3.5 transition ${
                                            b.unlocked
                                                ? "border-ink/15 bg-white shadow-sm"
                                                : "border-dashed border-ink/10 bg-[#FAF8F5] opacity-60"
                                        }`}
                                    >
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F3EFEA] text-xl">
                                            {b.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate font-display text-sm font-bold text-ink">
                                                    {b.title}
                                                </p>
                                                {b.unlocked && (
                                                    <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 font-display text-[10px] font-bold text-[#047857]">
                                                        Отключена
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-ink-soft">{b.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* ИСТОРИЯ НА ОПИТИТЕ */}
                <section>
                    <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-ink">
                        История на решените тестове
                    </h2>
                    {sorted.length === 0 ? (
                        <div className="sheet p-8 text-center text-sm text-ink-soft">
                            Все още нямаш завършени тестове. Избери тест от своя учебен план горе!
                        </div>
                    ) : (
                        <div className="sheet overflow-hidden p-0">
                            <ul className="divide-y divide-ink/10">
                                {sorted.map((a) => {
                                    const p = pctOf(a);
                                    return (
                                        <li
                                            key={a.id}
                                            className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#FAF8F5]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-display text-sm font-bold text-ink">
                                                    {a.exam_title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-ink-soft">
                                                    {new Date(a.completed_at).toLocaleDateString("bg-BG", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="font-display text-sm font-extrabold text-ink">
                                                        {a.score} / {a.total_questions} ({p}%)
                                                    </span>
                                                    {a.mon_grade && (
                                                        <span className="block font-display text-xs font-semibold text-[#047857]">
                                                            Оценка МОН: {a.mon_grade.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/test/${a.exam}`}
                                                    className="btn btn-white py-1.5 px-3 text-xs"
                                                >
                                                    Реши пак
                                                </Link>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}