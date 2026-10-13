import type { IconKind } from "@/lib/subjects";

const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export default function SubjectIcon({
    kind,
    name,
    className = "w-7 h-7",
}: {
    kind: IconKind;
    name?: string;
    className?: string;
}) {
    const text = (t: string, size = 15) => (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <text
                x="12"
                y="12"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-display)"
                fontWeight="800"
                fontSize={size}
                fill="currentColor"
            >
                {t}
            </text>
        </svg>
    );

    switch (kind) {
        case "math":
            return text("∑", 20);
        case "bg":
            return text("Аз", 13);
        case "en":
            return text("Ab", 14);
        case "letter":
            return text((name ?? "?").charAt(0).toUpperCase(), 17);
        case "history":
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
                    <path d="M3 9l9-5 9 5M5 9v0M4 20h16M6 20V11M10 20V11M14 20V11M18 20V11" />
                </svg>
            );
        case "geo":
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
                    <circle cx="12" cy="12" r="9" />
                    <ellipse cx="12" cy="12" rx="4" ry="9" />
                    <path d="M3 12h18" />
                </svg>
            );
        case "physics":
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
                    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
                </svg>
            );
        case "chem":
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
                    <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9" />
                </svg>
            );
        case "bio":
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
                    <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8" />
                </svg>
            );
    }
}
