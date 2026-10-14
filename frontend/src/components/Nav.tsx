"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout, isLoggedIn } from "@/lib/auth";
import { useAuthName, notifyAuthChange } from "@/lib/useAuth";
import { apiFetch } from "@/lib/api";

export function Logo({ showText = false }: { showText?: boolean }) {
    return (
        <Link
            href="/"
            aria-label="bgнаучи — начало"
            className="group inline-flex items-center gap-2.5 select-none focus:outline-none"
        >
            <div className="relative -my-4 flex h-16 w-auto shrink-0 items-center overflow-visible transition-transform duration-200 group-hover:scale-[1.03]">
                <Image
                    src="/logo.svg"
                    alt="bgнаучи лого"
                    width={220}
                    height={140}
                    priority
                    className="h-16 w-auto max-w-none object-contain scale-[1.65] origin-left"
                />
            </div>
            {showText && (
                <span className="font-display text-lg font-extrabold tracking-tight text-slate-950">
                    научи<span className="text-blue-600">.me</span>
                </span>
            )}
        </Link>
    );
}

export default function Nav() {
    const router = useRouter();
    const pathname = usePathname();
    const name = useAuthName();
    const loggedIn = name !== null;
    const [role, setRole] = useState<"student" | "teacher" | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!loggedIn || !isLoggedIn()) {
            setRole(null);
            return;
        }
        apiFetch("/api/auth/me/")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                setRole(data?.role === "teacher" ? "teacher" : "student");
            })
            .catch(() => setRole("student"));
    }, [loggedIn]);

    function handleLogout() {
        logout();
        setRole(null);
        setMobileOpen(false);
        notifyAuthChange();
        router.push("/");
    }

    const desktopLink = (href: string, label: string) => {
        const active = pathname === href;
        return (
            <Link
                href={href}
                className={`rounded-lg px-3.5 py-2 font-display text-xs font-bold transition-all ${
                    active
                        ? "bg-slate-950 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
            >
                {label}
            </Link>
        );
    };

    const mobileLink = (href: string, label: string, badge?: string) => {
        const active = pathname === href;
        return (
            <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 font-display text-sm font-bold transition ${
                    active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-800 active:bg-slate-100"
                }`}
            >
                <span>{label}</span>
                {badge && (
                    <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                        }`}
                    >
                        {badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                <Logo />

                {/* ДЕСКТОП НАВИГАЦИЯ (само за логнати потребители) */}
                {loggedIn && (
                    <nav
                        className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 lg:flex"
                        aria-label="Основна навигация"
                    >
                        {desktopLink("/profile", "Моят напредък")}
                        {desktopLink("/homework", "Домашно")}
                        {desktopLink("/duel", "1v1 Дуел")}
                        {desktopLink("/leaderboard", "Класация")}
                        {desktopLink("/calculator", "Калкулатор Бал")}

                        {role === "teacher" && (
                            <Link
                                href="/teacher"
                                className={`ml-1 rounded-lg px-3.5 py-2 font-display text-xs font-bold transition ${
                                    pathname === "/teacher"
                                        ? "bg-blue-600 text-white"
                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                }`}
                            >
                                За учители
                            </Link>
                        )}
                    </nav>
                )}

                {/* ДЯСНА ЗОНА (Десктоп + Мобилен бутон) */}
                <div className="flex items-center gap-2">
                    {loggedIn ? (
                        <>
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-display text-xs font-bold text-slate-900 shadow-2xs transition hover:border-slate-950"
                            >
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-600 text-[11px] font-extrabold text-white">
                                    {(name || "?").charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden max-w-[7.5rem] truncate sm:inline">{name}</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="hidden rounded-lg px-2.5 py-1.5 font-display text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:inline-block"
                            >
                                Изход
                            </button>

                            {/* Hamburger бутон за мобилни и таблети */}
                            <button
                                type="button"
                                onClick={() => setMobileOpen((v) => !v)}
                                aria-label="Отвори менюто"
                                aria-expanded={mobileOpen}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-900 lg:hidden"
                            >
                                {mobileOpen ? (
                                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
                                    </svg>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-xl px-3 py-2 font-display text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            >
                                Вход
                            </Link>
                            <Link href="/register" className="btn btn-sm">
                                Регистрация
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* МОБИЛНО ПАДАЩО МЕНЮ */}
            {loggedIn && mobileOpen && (
                <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 shadow-xl lg:hidden">
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-100 px-3.5 py-2.5">
                        <div className="min-w-0">
                            <p className="truncate font-display text-xs font-extrabold text-slate-950">{name}</p>
                            <p className="font-display text-[11px] font-semibold text-slate-500">
                                {role === "teacher" ? "Преподавателски профил" : "Ученически профил"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg bg-white px-3 py-1.5 font-display text-xs font-bold text-red-600 shadow-2xs"
                        >
                            Изход
                        </button>
                    </div>

                    <div className="grid gap-2">
                        {mobileLink("/profile", "Моят напредък")}
                        {mobileLink("/homework", "Домашна работа")}
                        {mobileLink("/duel", "1v1 Дуел с приятел")}
                        {mobileLink("/leaderboard", "Национална класация")}
                        {mobileLink("/calculator", "Калкулатор на бал")}
                        {role === "teacher" && mobileLink("/teacher", "Учителско табло", "Учител")}
                    </div>
                </div>
            )}
        </header>
    );
}