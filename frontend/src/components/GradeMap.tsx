"use client";

import Link from "next/link";

const GRADES = [
    {
        grade: 4,
        badge: "НВО • Начален етап",
        title: "4. клас",
        subtitle: "Национално външно оценяване",
        subjects: ["Математика", "Български език"],
        metrics: "Формат МОН • Бърза проверка",
        accent: "from-blue-600 to-indigo-600",
    },
    {
        grade: 7,
        badge: "НВО • Прием в гимназии",
        title: "7. клас",
        subtitle: "Кандидатстване след 7. клас",
        subjects: ["Математика (Модул 1 & 2)", "БЕЛ"],
        metrics: "Изчисляване на бал до 500 т.",
        accent: "from-indigo-600 to-violet-600",
    },
    {
        grade: 10,
        badge: "НВО • Първи гимназиален етап",
        title: "10. клас",
        subtitle: "Задължително външно оценяване",
        subjects: ["Математика", "БЕЛ"],
        metrics: "Алгебра, Геометрия и Езикови норми",
        accent: "from-sky-600 to-blue-700",
    },
    {
        grade: 12,
        badge: "ДЗИ • Зрелостен изпит",
        title: "12. клас",
        subtitle: "Държавни зрелостни изпити (Матура)",
        subjects: ["БЕЛ (Матура)", "Математика / Профил"],
        metrics: "Приравняване към оценка 2.00 – 6.00",
        accent: "from-slate-800 to-slate-950",
    },
];

export default function GradeMap() {
    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GRADES.map((item) => (
                <Link
                    key={item.grade}
                    href={`/klas/${item.grade}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-600 hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.18)]"
                >
                    {/* Горен цветен индикатор */}
                    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.accent}`} />

                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-display text-[11px] font-bold tracking-wide text-slate-700">
                                {item.badge}
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-display text-base font-extrabold text-white transition-colors group-hover:bg-blue-600">
                                {item.grade}
                            </span>
                        </div>

                        <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-slate-950">
                            {item.title}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            {item.subtitle}
                        </p>

                        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                            {item.subjects.map((sub) => (
                                <div key={sub} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                    <span>{sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="font-display text-xs font-semibold text-slate-400">
                            {item.metrics}
                        </span>
                        <span className="inline-flex items-center gap-1 font-display text-xs font-bold text-blue-600 transition-transform group-hover:translate-x-1">
                            Отвори
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                                <path
                                    d="M3.5 8h9m0 0L9 4.5M12.5 8 9 11.5"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}