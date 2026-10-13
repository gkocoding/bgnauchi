import { Logo } from "./Nav";

export default function AuthShell({
    title,
    pitch,
    children,
}: {
    title: string;
    pitch: string;
    children: React.ReactNode;
}) {
    return (
        <>
            <header className="mx-auto max-w-6xl px-5 py-5 sm:py-6">
                <Logo />
            </header>

            <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-4 md:grid-cols-[1fr_28rem] md:gap-16 md:pt-10">
                <div className="hidden md:block">
                    <h1 className="max-w-md font-display text-5xl font-extrabold leading-[1.1] tracking-tight">{title}</h1>
                    <p className="mt-5 max-w-sm text-lg leading-relaxed text-ink-soft">{pitch}</p>
                    <svg viewBox="0 0 220 90" className="mt-8 h-24 w-56 text-cobalt" aria-hidden="true">
                        <path
                            d="M6 70 C 40 70, 40 20, 80 20 S 120 70, 150 50 S 190 10, 214 16"
                            pathLength={1}
                            className="draw"
                            style={{ "--dur": "1.6s", "--delay": "0.3s" } as React.CSSProperties}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <div className="stamp-in">
                    <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight tracking-tight md:hidden">{title}</h1>
                    {children}
                </div>
            </main>
        </>
    );
}
