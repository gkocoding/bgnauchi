"use client";

import { useInView } from "./useInView";

const steps = [
    {
        title: "Избери клас и предмет",
        text: "Пътят по-горе води до всички тестове за твоя клас.",
    },
    {
        title: "Реши в реалния формат",
        text: "Въпросите следват структурата на матурите и националните изпити, а формулите се четат ясно.",
    },
    {
        title: "Прегледай грешките",
        text: "След теста виждаш кое е вярно. Всеки опит се пази в профила ти, за да следиш напредъка си.",
    },
];

export default function Steps() {
    const [ref, seen] = useInView<HTMLOListElement>(0.3);

    return (
        <ol ref={ref} className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {/* Линия между стъпките — расте отляво надясно, когато секцията се покаже */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[2.1rem] right-[calc(33.333%-55px)] top-[calc(2.1rem-1.5px)] hidden h-[3px] origin-left rounded-full bg-cobalt md:block"
                style={{
                    transform: seen ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform 1.5s cubic-bezier(0.6,0.05,0.3,1) 0.3s",
                }}
            />

            {steps.map((s, i) => (
                <li key={s.title} className="relative flex gap-5 md:flex-col md:gap-4">
                    <span
                        className={`relative z-10 grid h-[4.2rem] w-[4.2rem] shrink-0 place-items-center rounded-full border-[3px] border-ink bg-marker font-display text-2xl font-extrabold shadow-pop-sm transition-[transform,opacity] duration-500 ease-spring ${
                            seen ? "scale-100 opacity-100" : "scale-50 opacity-0"
                        }`}
                        style={{ transitionDelay: `${0.25 + i * 0.4}s` }}
                    >
                        {i + 1}
                    </span>
                    <div>
                        <h3 className="mb-2 font-display text-xl font-bold leading-snug">{s.title}</h3>
                        <p className="max-w-sm text-[1.02rem] leading-relaxed text-ink-soft">{s.text}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
