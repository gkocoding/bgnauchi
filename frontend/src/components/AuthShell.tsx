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
        <div className="min-h-screen bg-[#F4F6F9]">
            <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
                    <Logo />
                </div>
            </header>

            <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-8 md:grid-cols-[1fr_28rem] md:gap-16 md:pt-14">
                <div className="hidden md:block">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-display text-xs font-bold text-blue-700">
                        Образователна платформа БГнаучи
                    </span>
                    <h1 className="mt-4 max-w-md font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-950">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-600">{pitch}</p>

                    <div className="mt-8 grid max-w-md gap-3">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 font-display text-xs font-extrabold text-blue-600">
                                01
                            </span>
                            <span className="font-display text-xs font-bold text-slate-700">
                                Автоматично оценяване по официалната скала на МОН
                            </span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 font-display text-xs font-extrabold text-blue-600">
                                02
                            </span>
                            <span className="font-display text-xs font-bold text-slate-700">
                                Подробни решения и интерактивна тетрадка за чернова
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <h1 className="mb-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-950 md:hidden">
                        {title}
                    </h1>
                    {children}
                </div>
            </main>
        </div>
    );
}