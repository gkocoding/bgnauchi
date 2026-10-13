"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Station = { num: number; label: string; x: number; y: number };

// x и y са дял (0..1) от размера на картата
const stations: Station[] = [
    { num: 4, label: "начален етап", x: 0.17, y: 0.7 },
    { num: 7, label: "прогимназия", x: 0.4, y: 0.3 },
    { num: 10, label: "гимназия", x: 0.62, y: 0.6 },
    { num: 12, label: "матура", x: 0.85, y: 0.2 },
];

function segmentPath(a: Station, b: Station, w: number, h: number) {
    const ax = a.x * w, ay = a.y * h, bx = b.x * w, by = b.y * h;
    const k = (bx - ax) * 0.55;
    return `M ${ax} ${ay} C ${ax + k} ${ay}, ${bx - k} ${by}, ${bx} ${by}`;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function GradeMap() {
    const boxRef = useRef<HTMLDivElement>(null);
    const segRefs = useRef<(SVGPathElement | null)[]>([]);
    const nibRef = useRef<HTMLDivElement>(null);
    const doneRef = useRef(false);
    const elapsedRef = useRef(-350); // мс от началото на анимацията (отрицателно = още чакаме старта)

    const [size, setSize] = useState({ w: 0, h: 0 });
    const [reached, setReached] = useState(-1); // индекс на последната "стигната" станция

    // Следим размера, за да рисуваме пътя в реални пиксели (без разтягане)
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Оркестрираният момент: химикалът чертае пътя, станциите се "печатат" при пристигане
    useEffect(() => {
        if (!size.w) return;
        const segs = segRefs.current.filter(Boolean) as SVGPathElement[];
        if (segs.length !== stations.length - 1) return;

        const lengths = segs.map((s) => s.getTotalLength());
        const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
        const total = lengths.reduce((a, b) => a + b, 0);
        const thresholds = [...starts, total]; // къде се намира всяка станция по пътя

        const apply = (dist: number) => {
            segs.forEach((seg, i) => {
                const drawn = Math.min(Math.max(dist - starts[i], 0), lengths[i]);
                seg.style.strokeDasharray = `${lengths[i]}`;
                seg.style.strokeDashoffset = `${lengths[i] - drawn}`;
            });
            const nib = nibRef.current;
            if (nib) {
                let idx = segs.findIndex((_, i) => dist <= starts[i] + lengths[i]);
                if (idx === -1) idx = segs.length - 1;
                const p = segs[idx].getPointAtLength(Math.min(Math.max(dist - starts[idx], 0), lengths[idx]));
                nib.style.transform = `translate(${p.x}px, ${p.y}px)`;
                nib.style.opacity = dist <= 0 || dist >= total ? "0" : "1";
            }
        };

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (doneRef.current || reduce) {
            apply(total);
            doneRef.current = true;
            setReached(stations.length - 1);
            return;
        }

        const duration = 2900;
        // При преоразмеряване продължаваме оттам, докъдето е стигнала анимацията, а не започваме отначало
        const t0 = performance.now() - elapsedRef.current;
        let last = -1;
        let raf = 0;

        const tick = (now: number) => {
            elapsedRef.current = now - t0;
            const t = Math.min(Math.max((now - t0) / duration, 0), 1);
            const dist = easeInOutCubic(t) * total;
            apply(dist);

            let r = -1;
            thresholds.forEach((th, i) => {
                if (now >= t0 && dist >= th - 0.5) r = i;
            });
            if (r === -1 && last === -1 && elapsedRef.current > 0) r = 0;
            if (r !== last) {
                last = r;
                setReached(r);
            }

            if (t < 1) raf = requestAnimationFrame(tick);
            else doneRef.current = true;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [size]);

    return (
        <div
            ref={boxRef}
            id="klas-map"
            className="relative mx-auto aspect-[5/6] w-full max-w-5xl scroll-mt-6 sm:aspect-[2.3/1]"
        >
            {/* Малки драсканици по полетата */}
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-[2%] top-[6%] h-7 w-7 text-cobalt/30" aria-hidden="true">
                <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 80 20" className="pointer-events-none absolute bottom-[4%] left-[44%] hidden h-5 w-20 text-cobalt/30 sm:block" aria-hidden="true">
                <path d="M2 10q9-14 18 0t18 0 18 0 18 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute bottom-[10%] right-[3%] h-6 w-6 text-cobalt/30" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
            </svg>

            {size.w > 0 && (
                <svg
                    className="pointer-events-none absolute inset-0"
                    width={size.w}
                    height={size.h}
                    viewBox={`0 0 ${size.w} ${size.h}`}
                    aria-hidden="true"
                >
                    {/* Молив-пунктир: пътят, който предстои */}
                    {stations.slice(0, -1).map((s, i) => (
                        <path
                            key={`g${s.num}`}
                            d={segmentPath(s, stations[i + 1], size.w, size.h)}
                            fill="none"
                            stroke="#B9C6F5"
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray="1 11"
                        />
                    ))}
                    {/* Мастилото: чертае се с химикал */}
                    {stations.slice(0, -1).map((s, i) => (
                        <path
                            key={s.num}
                            ref={(el) => {
                                segRefs.current[i] = el;
                            }}
                            d={segmentPath(s, stations[i + 1], size.w, size.h)}
                            fill="none"
                            stroke="#2B50E6"
                            strokeWidth={5}
                            strokeLinecap="round"
                            style={{ strokeDasharray: "0 100000" }}
                        />
                    ))}
                </svg>
            )}

            {/* Връхчето на молива, което върви по пътя */}
            <div
                ref={nibRef}
                className="pointer-events-none absolute left-0 top-0 z-20 opacity-0"
                aria-hidden="true"
            >
                <svg viewBox="0 0 24 24" width="34" height="34" className="-translate-x-1 -translate-y-[1.65rem] drop-shadow-[2px_2px_0_rgba(20,33,61,0.25)]">
                    <path d="M3 21l1.5-5L16 4.5a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L8 19.5 3 21z" fill="#FFD93D" stroke="#14213D" strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M14.5 6l3.5 3.5" stroke="#14213D" strokeWidth="1.6" />
                    <path d="M3 21l1.5-5 3.5 3.5L3 21z" fill="#14213D" />
                </svg>
            </div>

            {stations.map((s, i) => {
                const on = reached >= i;
                return (
                    <Link
                        key={s.num}
                        href={`/klas/${s.num}`}
                        aria-label={`${s.num}. клас — ${s.label}`}
                        tabIndex={on ? 0 : -1}
                        className="group absolute z-10 -translate-x-1/2 -translate-y-[2.3rem] sm:-translate-y-[2.8rem]"
                        style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
                    >
                        <div
                            className={`flex flex-col items-center transition-[transform,opacity] duration-500 ease-spring ${
                                on ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
                            }`}
                        >
                            <div className="relative">
                                {on && (
                                    <span
                                        key={`r${i}`}
                                        className="ripple absolute inset-0 rounded-full border-[3px] border-cobalt"
                                        aria-hidden="true"
                                    />
                                )}
                                <span className="stamp !h-[3.6rem] !w-[3.6rem] !text-[1.6rem] transition-all duration-300 ease-spring group-hover:-rotate-[8deg] group-hover:scale-[1.18] group-hover:shadow-pop group-active:scale-95 sm:!h-[4.8rem] sm:!w-[4.8rem] sm:!text-[2.1rem]">
                                    {s.num}
                                </span>
                            </div>
                            <span className="mt-1.5 whitespace-nowrap font-hand text-[1.05rem] font-semibold leading-none text-ink [text-shadow:0_0_5px_#F6F8FF,0_0_5px_#F6F8FF,0_0_9px_#F6F8FF] sm:text-[1.5rem]">
                                {s.label}
                            </span>
                            <span className="mt-1 hidden h-0.5 w-0 rounded bg-cobalt transition-all duration-300 group-hover:w-full sm:block" aria-hidden="true" />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
