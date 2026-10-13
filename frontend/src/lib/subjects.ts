// Общи данни за предметите и класовете (използват се от няколко страници)

export type IconKind = "math" | "bg" | "en" | "history" | "geo" | "physics" | "chem" | "bio" | "letter";

export type SubjectMeta = { color: string; tint: string; icon: IconKind };

export const subjectMeta: Record<string, SubjectMeta> = {
    "Математика": { color: "#2B50E6", tint: "#E4EAFF", icon: "math" },
    "Български език и литература": { color: "#7A3FD1", tint: "#EFE6FF", icon: "bg" },
    "Английски език": { color: "#0A8FB0", tint: "#DDF3FA", icon: "en" },
    "История": { color: "#D97706", tint: "#FFEBCC", icon: "history" },
    "География": { color: "#2E9E6B", tint: "#DAF3E6", icon: "geo" },
    "Физика": { color: "#E0457B", tint: "#FFE1EC", icon: "physics" },
    "Химия": { color: "#12A594", tint: "#D6F5F0", icon: "chem" },
    "Биология": { color: "#84A60B", tint: "#EAF3C6", icon: "bio" },
};

const fallback: Pick<SubjectMeta, "color" | "tint">[] = [
    { color: "#2B50E6", tint: "#E4EAFF" },
    { color: "#7A3FD1", tint: "#EFE6FF" },
    { color: "#D97706", tint: "#FFEBCC" },
    { color: "#12A594", tint: "#D6F5F0" },
    { color: "#E0457B", tint: "#FFE1EC" },
];

export function metaFor(name: string, index = 0): SubjectMeta {
    return subjectMeta[name] ?? { ...fallback[index % fallback.length], icon: "letter" };
}

export const gradeMeta: Record<string, { label: string }> = {
    "4": { label: "Начален етап" },
    "7": { label: "Прогимназия" },
    "10": { label: "Гимназия" },
    "12": { label: "Матура" },
};

export function gradeLabel(grade: string): string {
    return gradeMeta[grade]?.label ?? `${grade}. клас`;
}

export function examTypeLabel(type: string): string {
    return type === "matura" ? "Матура" : "Кандидатстудентски";
}
