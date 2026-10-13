"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useAuthName, notifyAuthChange } from "@/lib/useAuth";

export function Logo() {
    return (
        <Link
            href="/"
            aria-label="bgнаучи — начало"
            className="group inline-flex items-baseline font-display text-[1.5rem] leading-none tracking-tight"
        >
            <span className="font-semibold">bg</span>
            <span className="relative isolate ml-px font-extrabold">
                <span
                    aria-hidden="true"
                    className="absolute -inset-x-1 bottom-0 -z-10 h-[52%] origin-left -skew-x-6 rounded-[3px] bg-marker transition-transform duration-300 ease-spring group-hover:scale-x-110"
                />
                научи
            </span>
        </Link>
    );
}

export default function Nav() {
    const router = useRouter();
    const name = useAuthName();
    const loggedIn = name !== null;

    function handleLogout() {
        logout();
        notifyAuthChange();
        router.push("/");
    }

    return (
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:py-6">
            <Logo />

            <nav className="flex items-center gap-2 sm:gap-3" aria-label="Основна навигация">
                {loggedIn ? (
                    <>
                        <Link
                            href="/profile"
                            className="group flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pl-1 pr-3 font-display text-sm font-semibold shadow-pop-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop"
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-marker text-sm font-extrabold transition-transform duration-300 ease-spring group-hover:rotate-[-12deg] group-hover:scale-110">
                                {(name || "?").charAt(0).toUpperCase()}
                            </span>
                            <span className="max-w-[8rem] truncate">{name}</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="marker-line px-1 font-display text-sm font-medium text-ink-soft hover:text-ink"
                        >
                            Изход
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="marker-line px-1 font-display text-sm font-semibold text-ink"
                        >
                            Вход
                        </Link>
                        <Link href="/register" className="btn btn-sm">
                            Регистрация
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
