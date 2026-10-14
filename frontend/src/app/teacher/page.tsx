"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function TeacherPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [grade, setGrade] = useState(7);
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadDashboard = async () => {
        try {
            const res = await apiFetch("/api/teacher/dashboard/");
            if (res.status === 401) {
                router.push("/login?next=/teacher");
                return;
            }
            if (!res.ok) {
                const text = await res.text();
                setErrorMsg(`Сървърна грешка (${res.status}): Провери миграциите и urls.py. ${text.slice(0, 120)}`);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setAssignments(data.assignments || []);
            setTopics(data.available_topics || []);
            setLoading(false);
        } catch {
            setErrorMsg("Няма връзка с бекенд сървъра.");
            setLoading(false);
        }
    };

useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login?next=/teacher");
            return;
        }
        apiFetch("/api/auth/me/")
            .then((r) => (r.ok ? r.json() : null))
            .then((me) => {
                if (me?.role !== "teacher") {
                    router.push("/profile");
                } else {
                    loadDashboard();
                }
            });
    }, [router]);

    async function createHomework(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        const res = await apiFetch("/api/teacher/dashboard/", {
            method: "POST",
            body: JSON.stringify({
                title: title || `Домашна работа — ${grade}. клас`,
                grade,
                topic,
                count,
            }),
        });
        if (res.ok) {
            setTitle("");
            loadDashboard();
        } else {
            setErrorMsg("Неуспешно създаване на задание. Провери дали има въпроси в базата.");
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
                <h1 className="font-display text-4xl font-extrabold tracking-tight">👩‍🏫 Учителско табло</h1>
                <p className="mt-2 mb-8 font-hand text-[1.7rem] font-semibold text-cobalt-deep">
                    Създай тест за класа си за 10 секунди и следи резултатите автоматично
                </p>

                {errorMsg && (
                    <div className="sheet mb-6 border-pen bg-pen-tint p-4 font-display text-sm font-bold text-pen">
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={createHomework} className="sheet mb-10 bg-[#D8F5E8] p-6">
                    <h2 className="mb-4 font-display text-xl font-extrabold">➕ Генерирай ново задание за клас</h2>
                    <div className="grid gap-4 sm:grid-cols-4">
                        <input
                            type="text"
                            placeholder="Заглавие (напр. 7А клас - Геометрия)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="sm:col-span-2 rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-display text-sm font-semibold"
                        />
                        <select
                            value={grade}
                            onChange={(e) => setGrade(Number(e.target.value))}
                            className="rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-display text-sm font-bold"
                        >
                            <option value={4}>4. клас (НВО)</option>
                            <option value={7}>7. клас (НВО)</option>
                            <option value={10}>10. клас (НВО)</option>
                            <option value={12}>12. клас (ДЗИ)</option>
                        </select>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="rounded-xl border-2 border-ink bg-white px-4 py-2.5 font-display text-sm font-bold"
                        >
                            <option value="">Всички теми</option>
                            {topics.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <label className="font-display text-xs font-bold">
                            Брой задачи:{" "}
                            <input
                                type="number"
                                min={1}
                                max={40}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="ml-2 w-16 rounded-lg border-2 border-ink bg-white px-2 py-1 text-center font-extrabold"
                            />
                        </label>
                        <button type="submit" className="btn">
                            Създай задание с код
                        </button>
                    </div>
                </form>

                <h2 className="mb-4 font-display text-2xl font-extrabold">Моите задания</h2>
                {assignments.length === 0 ? (
                    <div className="sheet border-dashed p-8 text-center text-ink-soft">
                        Все още нямаш създадени задания. Използвай формата горе, за да генерираш първия си код за клас!
                    </div>
                ) : (
                    <div className="space-y-5">
                        {assignments.map((a) => (
                            <div key={a.id} className="sheet p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 pb-4">
                                    <div>
                                        <h3 className="font-display text-lg font-extrabold">{a.title}</h3>
                                        <p className="text-xs text-ink-soft">
                                            {a.grade}. клас • {a.question_count} въпроса
                                        </p>
                                    </div>
                                    <div className="rounded-xl border-2 border-ink bg-[#FFF4BF] px-4 py-1.5 font-display text-sm font-extrabold">
                                        Код за учениците: {a.code}
                                    </div>
                                </div>
                                {a.submissions.length === 0 ? (
                                    <p className="mt-4 text-sm text-ink-soft">
                                        Все още няма предадени решения от ученици.
                                    </p>
                                ) : (
                                    <ul className="mt-4 divide-y divide-ink/10">
                                        {a.submissions.map((s: any) => (
                                            <li key={s.student} className="flex justify-between py-2 font-display text-sm">
                                                <span className="font-bold">{s.student}</span>
                                                <span className="font-extrabold text-cobalt-deep">
                                                    {s.score}/{s.total} ({s.pct}%)
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}