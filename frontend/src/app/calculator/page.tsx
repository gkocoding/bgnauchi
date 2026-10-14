"use client";

import { useState } from "react";
import Nav from "@/components/Nav";

const HIGH_SCHOOLS = [
    { name: "СМГ „Паисий Хилендарски“ (София)", minBal: 482, city: "София" },
    { name: "ТУЕС към ТУ-София (Софтуерни и хардуерни науки)", minBal: 468, city: "София" },
    { name: "91. НЕГ „Проф. Константин Гълъбов“ (Първа немска)", minBal: 462, city: "София" },
    { name: "73. СУ „Владислав Граматик“ (Втора немска)", minBal: 448, city: "София" },
    { name: "164. ГПИЕ „Мигел де Сервантес“ (Испанска)", minBal: 442, city: "София" },
    { name: "Първа АЕГ (Английска гимназия - София)", minBal: 436, city: "София" },
    { name: "НПМГ „Акад. Любомир Чакалов“", minBal: 430, city: "София" },
    { name: "МГ „Акад. Кирил Попов“ (Пловдив)", minBal: 455, city: "Пловдив" },
    { name: "ЕГ „Пловдив“ (Английска гимназия - Пловдив)", minBal: 432, city: "Пловдив" },
    { name: "МГ „Д-р Петър Берон“ (Варна)", minBal: 452, city: "Варна" },
    { name: "ПГЕЕ / Профилирани гимназии (Среден праг)", minBal: 360, city: "Цялата страна" },
];

const GRADE_TO_POINTS: Record<number, number> = {
    6: 50,
    5: 39,
    4: 26,
    3: 15,
};

export default function CalculatorPage() {
    const [belPoints, setBelPoints] = useState(75);
    const [matPoints, setMatPoints] = useState(75);
    const [belWeight, setBelWeight] = useState(2);
    const [matWeight, setMatWeight] = useState(2);
    const [diplomaGrade1, setDiplomaGrade1] = useState(6);
    const [diplomaGrade2, setDiplomaGrade2] = useState(6);

    const totalBal =
        belPoints * belWeight +
        matPoints * matWeight +
        (GRADE_TO_POINTS[diplomaGrade1] || 50) +
        (GRADE_TO_POINTS[diplomaGrade2] || 50);

    return (
        <>
            <Nav />
            <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                    🧮 Калкулатор на бал (7. клас НВО)
                </h1>
                <p className="mt-2 mb-8 font-hand text-[1.7rem] font-semibold text-cobalt-deep">
                    Изчисли своя състезателен бал от 500 точки и виж къде ти стига за прием
                </p>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <div className="sheet space-y-6 p-6 sm:p-8">
                        <div>
                            <div className="mb-2 flex justify-between font-display text-sm font-extrabold">
                                <span>Точки от НВО по БЕЛ (0 – 100):</span>
                                <span className="text-cobalt-deep">{belPoints} т.</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={belPoints}
                                onChange={(e) => setBelPoints(Number(e.target.value))}
                                className="w-full accent-cobalt"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex justify-between font-display text-sm font-extrabold">
                                <span>Точки от НВО по Математика (0 – 100):</span>
                                <span className="text-cobalt-deep">{matPoints} т.</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={matPoints}
                                onChange={(e) => setMatPoints(Number(e.target.value))}
                                className="w-full accent-cobalt"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block font-display text-xs font-bold">
                                    Формула за профила:
                                </label>
                                <select
                                    value={`${belWeight}-${matWeight}`}
                                    onChange={(e) => {
                                        const [b, m] = e.target.value.split("-").map(Number);
                                        setBelWeight(b);
                                        setMatWeight(m);
                                    }}
                                    className="w-full rounded-xl border-2 border-ink bg-white px-3 py-2 font-display text-xs font-bold"
                                >
                                    <option value="2-2">2×БЕЛ + 2×МАТ (Езикови / Стандарт)</option>
                                    <option value="1-3">1×БЕЛ + 3×МАТ (Математически / ТУЕС / СМГ)</option>
                                    <option value="3-1">3×БЕЛ + 1×МАТ (Хуманитарни профили)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1.5 block font-display text-xs font-bold">
                                        Оценка 1 (Свидетелство):
                                    </label>
                                    <select
                                        value={diplomaGrade1}
                                        onChange={(e) => setDiplomaGrade1(Number(e.target.value))}
                                        className="w-full rounded-xl border-2 border-ink bg-white px-3 py-2 font-display text-xs font-bold"
                                    >
                                        <option value={6}>Отличен 6 (50 т.)</option>
                                        <option value={5}>Мн. добър 5 (39 т.)</option>
                                        <option value={4}>Добър 4 (26 т.)</option>
                                        <option value={3}>Среден 3 (15 т.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block font-display text-xs font-bold">
                                        Оценка 2 (Свидетелство):
                                    </label>
                                    <select
                                        value={diplomaGrade2}
                                        onChange={(e) => setDiplomaGrade2(Number(e.target.value))}
                                        className="w-full rounded-xl border-2 border-ink bg-white px-3 py-2 font-display text-xs font-bold"
                                    >
                                        <option value={6}>Отличен 6 (50 т.)</option>
                                        <option value={5}>Мн. добър 5 (39 т.)</option>
                                        <option value={4}>Добър 4 (26 т.)</option>
                                        <option value={3}>Среден 3 (15 т.)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sheet flex flex-col items-center justify-center bg-[#FFF4BF] p-6 text-center">
                        <p className="font-display text-sm font-bold text-ink-soft uppercase">
                            Твоят състезателен бал:
                        </p>
                        <div className="my-3 font-display text-6xl font-extrabold leading-none text-ink">
                            {totalBal.toFixed(1)}
                            <span className="text-2xl text-ink-soft"> / 500</span>
                        </div>
                        <p className="font-hand text-2xl font-bold text-cobalt-deep">
                            {totalBal >= 450
                                ? "Отличен шанс за топ гимназиите!"
                                : totalBal >= 380
                                ? "Много добър бал за повечето профили!"
                                : "Реши още няколко теста, за да вдигнеш бала!"}
                        </p>
                    </div>
                </div>

                <h2 className="mt-10 mb-4 font-display text-2xl font-extrabold">
                    Ориентировъчни минимални балове по гимназии
                </h2>
                <div className="sheet overflow-hidden p-0">
                    <ul className="divide-y-2 divide-ink/15">
                        {HIGH_SCHOOLS.map((hs) => {
                            const reached = totalBal >= hs.minBal;
                            return (
                                <li
                                    key={hs.name}
                                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                                >
                                    <div>
                                        <p className="font-display font-bold">{hs.name}</p>
                                        <p className="text-xs text-ink-soft">{hs.city} • Праг: ~{hs.minBal} т.</p>
                                    </div>
                                    <span
                                        className={`rounded-full border-2 border-ink px-3.5 py-1 font-display text-xs font-extrabold ${
                                            reached
                                                ? "bg-[#D8F5E8] text-ok"
                                                : "bg-pen-tint text-pen"
                                        }`}
                                    >
                                        {reached
                                            ? "✓ Балът ти стига!"
                                            : `Още ${(hs.minBal - totalBal).toFixed(0)} т.`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </main>
        </>
    );
}