"use client";

import { useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import GradeMap from "@/components/GradeMap";
import Steps from "@/components/Steps";
import DailyChallenge from "@/components/DailyChallenge";
import { useAuthName } from "@/lib/useAuth";


export default function Home() {
    const username = useAuthName();
    const isAuthenticated = username !== null;

    useEffect(() => {
        document.title = "БГнаучи | Начало";
    }, []);

    return (
        <>
            <Nav />

            <main>
                {/* HERO СЕКЦИЯ: Висококонтрастна академична типография */}
                <section className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:pt-14">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-ink-soft shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-[#1E40AF]" />
                                Платформа за НВО (4., 7., 10. клас) и ДЗИ (12. клас)
                            </div>

                            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
                                Реши тест.{" "}
                                <span className="text-[#1E40AF]">Разбери грешките.</span>{" "}
                                Влез с висок бал.
                            </h1>

                            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                                Реални изпитни формати по Математика и БЕЛ с моментална проверка,
                                приравнена оценка по скалата на МОН и разписани решения стъпка по стъпка.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3.5">
                                {isAuthenticated ? (
                                    <>
                                        <Link href="/profile" className="btn">
                                            Към моя учебен план
                                        </Link>
                                        <Link href="#klas-map" className="btn btn-white">
                                            Избери тест по клас
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/register" className="btn">
                                            Създай безплатен профил
                                        </Link>
                                        <Link href="#klas-map" className="btn btn-white">
                                            Разгледай класовете
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Симетрична информационна карта вдясно */}
                        <div className="sheet p-6 sm:p-8">
                            <p className="font-display text-xs font-bold uppercase tracking-wider text-ink-soft">
                                Защо учениците избират bgнаучи
                            </p>
                            <ul className="mt-5 space-y-4">
                                {[
                                    {
                                        title: "Точен формат на МОН",
                                        desc: "Въпроси, точки и време, съобразени с реалните национални изпити.",
                                    },
                                    {
                                        title: "Решения стъпка по стъпка",
                                        desc: "Към всяка сбъркана задача виждаш логиката и формулата зад отговора.",
                                    },
                                    {
                                        title: "Фокус върху слабите теми",
                                        desc: "Автоматичен анализ на темите, в които губиш точки, и целенасочен преговор.",
                                    },
                                ].map((item) => (
                                    <li key={item.title} className="flex items-start gap-3.5">
                                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-xs font-extrabold text-[#1E40AF]">
                                            ✓
                                        </span>
                                        <div>
                                            <p className="font-display text-sm font-bold text-ink">{item.title}</p>
                                            <p className="mt-0.5 text-sm leading-snug text-ink-soft">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ПЪТЯТ ПО КЛАСОВЕ */}
                <section id="klas-map" className="mx-auto max-w-6xl scroll-mt-16 px-5 pb-16 sm:pb-20">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                                Избери своя етап на подготовка
                            </h2>
                            <p className="mt-1 text-sm text-ink-soft">
                                Кликни върху своя клас, за да отвориш наличните тестове по предмети
                            </p>
                        </div>
                    </div>
                    <GradeMap />
                </section>

                {/* ЗАДАЧА НА ДЕНЯ — Показва се САМО за логнати потребители */}
                {isAuthenticated && <DailyChallenge />}

                {/* КАК РАБОТИ */}
                <section className="border-y border-ink/10 bg-white">
                    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
                        <h2 className="mb-10 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Структуриран процес в 3 стъпки
                        </h2>
                        <Steps />
                    </div>
                </section>

                {/* ФИНАЛЕН CTA БЛОК */}
                <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
                    <div className="sheet bg-white px-6 py-10 sm:px-12 sm:py-14">
                        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="max-w-xl">
                                <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    {isAuthenticated
                                        ? "Продължи подготовката си още днес"
                                        : "Започни подготовката си с безплатен профил"}
                                </h2>
                                <p className="mt-2 text-base text-ink-soft">
                                    {isAuthenticated
                                        ? "Проследи напредъка си по теми и поправи сбърканите задачи в личния си учебен хъб."
                                        : "Регистрацията отнема по-малко от минута и отключва история на резултатите, дневни задачи и анализ по теми."}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {isAuthenticated ? (
                                    <Link href="/profile" className="btn">
                                        Отвори Моят напредък
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/register" className="btn">
                                            Регистрирай се безплатно
                                        </Link>
                                        <Link href="/login" className="btn btn-white">
                                            Вход в профила
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-ink/10 bg-white/60 py-8">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 font-display text-xs text-ink-soft">
                    <span>© {new Date().getFullYear()} bgнаучи — Образователна платформа за НВО и ДЗИ</span>
                    <span>Проектирана за спокойна и фокусирана подготовка</span>
                </div>
            </footer>
        </>
    );
}