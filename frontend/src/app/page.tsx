import Link from "next/link";
import Nav from "@/components/Nav";
import GradeMap from "@/components/GradeMap";
import Steps from "@/components/Steps";

export default function Home() {
    return (
        <>
            <Nav />

            <main>
                {/* ПЪРВИ ЕКРАН: обещанието и пътят по класове */}
                <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-4 pt-4 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-14 lg:pt-8">
                    <h1 className="font-display text-[clamp(1.95rem,8.6vw,2.7rem)] font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-[4rem]">
                        <span className="block whitespace-nowrap">Реши тест.</span>
                        <span className="block whitespace-nowrap">Виж грешките.</span>
                        <span className="block whitespace-nowrap">Стани по-добър.</span>
                    </h1>
                    <div>
                        <p className="max-w-md text-lg leading-relaxed text-ink-soft">
                            Тестове за 4., 7., 10. и 12. клас във формата на истинските изпити. Резултатът излиза веднага,
                            а при грешка виждаш верния отговор.
                        </p>
                        <div className="mt-6 flex items-end gap-3 font-hand text-[1.6rem] font-semibold leading-none text-cobalt-deep">
                            <span>Избери своя клас</span>
                            <svg viewBox="0 0 40 40" className="mb-[-6px] h-9 w-9" aria-hidden="true">
                                <path d="M6 6 C 8 22, 16 28, 30 32 M22 33 l9 -1 -5 -8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-5 pb-20 sm:pb-28">
                    <GradeMap />
                </section>

                {/* КАК РАБОТИ — това наистина е последователност, затова е номерирано */}
                <section className="border-y-2 border-ink bg-white">
                    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
                        <h2 className="mb-12 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Как работи
                        </h2>
                        <Steps />
                    </div>
                </section>

                {/* ПОКАНА */}
                <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
                    <div className="sheet relative overflow-hidden px-6 py-12 sm:px-14 sm:py-16">
                        <div className="relative z-10 max-w-xl">
                            <h2 className="mb-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                                Първият тест е безплатен и отнема минути
                            </h2>
                            <p className="mb-8 text-lg text-ink-soft">
                                Избери своя клас от пътя и започни. Профилът ти пази всеки резултат.
                            </p>
                            <Link href="#klas-map" className="btn">
                                Избери клас
                                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                                    <path d="M10 3v13M4 11l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                        </div>
                        <svg
                            viewBox="0 0 200 200"
                            className="pointer-events-none absolute -bottom-12 right-10 hidden h-64 w-64 text-marker sm:block"
                            aria-hidden="true"
                        >
                            <circle cx="100" cy="100" r="86" fill="currentColor" stroke="#14213D" strokeWidth="4" />
                            <path d="M62 112l26 26 52-62" fill="none" stroke="#14213D" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </section>
            </main>

            <footer className="mx-auto max-w-6xl px-5 pb-10 font-display text-sm text-ink-soft">
                bgnauchi.me — подготовка за матури и национални изпити
            </footer>
        </>
    );
}
