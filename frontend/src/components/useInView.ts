"use client";

import { useEffect, useRef, useState } from "react";

// Връща [ref, видим]. Става true веднъж, когато елементът влезе в екрана.
export function useInView<T extends HTMLElement>(threshold = 0.35) {
    const ref = useRef<T>(null);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setSeen(true);
                    io.disconnect();
                }
            },
            { threshold }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);

    return [ref, seen] as const;
}
