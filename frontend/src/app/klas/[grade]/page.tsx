import Link from "next/link";

type Subject = {
    id: number;
    name: string;
};

type Exam = {
    id: number;
    title: string;
    exam_type: string;
    grade: number;
    subject: Subject;
};

const gradeMeta: Record<string, { label: string }> = {
    "4": { label: "начален етап" },
    "7": { label: "прогимназия" },
    "10": { label: "гимназия" },
    "12": { label: "матура" },
};

// Всеки предмет — собствена "звездна система": символ + акцентен цвят от палитрата
const subjectMeta: Record<string, { symbol: string; color: string }> = {
    "Математика": { symbol: "∑", color: "#4FD1C5" },
    "Български език и литература": { symbol: "Аз", color: "#F2C14E" },
    "Английски език": { symbol: "Ab", color: "#A78BFA" },
    "История": { symbol: "🏛", color: "#F2A65A" },
    "География": { symbol: "◐", color: "#5EC8E0" },
    "Физика": { symbol: "⚛", color: "#8EE3C8" },
    "Химия": { symbol: "⚗", color: "#E29AE0" },
    "Биология": { symbol: "🧬", color: "#7FD88A" },
};

const fallbackColors = ["#4FD1C5", "#A78BFA", "#F2C14E", "#5EC8E0", "#F2A65A"];

function metaFor(name: string, index: number) {
    return subjectMeta[name] ?? { symbol: name.charAt(0), color: fallbackColors[index % fallbackColors.length] };
}

async function getExams(grade: string): Promise<Exam[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/?grade=${grade}`, {
        cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
}

function getUniqueSubjects(exams: Exam[]): Subject[] {
    const map = new Map<number, Subject>();
    for (const exam of exams) {
        if (exam.subject && !map.has(exam.subject.id)) {
            map.set(exam.subject.id, exam.subject);
        }
    }
    return Array.from(map.values());
}

export default async function KlasPage({
    params,
}: {
    params: Promise<{ grade: string }>;
}) {
    const { grade } = await params;
    const exams = await getExams(grade);
    const subjects = getUniqueSubjects(exams);
    const meta = gradeMeta[grade] ?? { label: "клас " + grade };

    return (
        <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen relative overflow-hidden">
            <div className="starfield" />
            <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#4FD1C5] opacity-[0.07] blur-[100px]" />
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-[#A78BFA] opacity-[0.08] blur-[100px]" />

            <nav className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                <Link href="/" className="font-display text-xl font-bold tracking-wide">
                    bg<span className="text-[#4FD1C5]">научи</span>
                </Link>
                <Link
                    href="/"
                    className="text-[#9CA3C4] text-sm font-medium px-3 hover:text-[#EDEFF7] transition-colors"
                >
                    ← Начало
                </Link>
            </nav>

            <section className="relative z-10 max-w-3xl mx-auto px-6 pt-10 pb-14 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F2C14E] mb-6 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E] pulse-node" />
                    СЕКТОР: {grade}. КЛАС · {meta.label.toUpperCase()}
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
                    Избери своята{" "}
                    <span className="bg-gradient-to-r from-[#4FD1C5] to-[#A78BFA] bg-clip-text text-transparent">
                        звездна система
                    </span>
                </h1>
                <p className="text-[#9CA3C4] text-lg max-w-xl mx-auto">
                    Всеки предмет е отделна система — влез, за да видиш наличните тестове.
                </p>
            </section>

            <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
                {subjects.length === 0 ? (
                    <div className="bg-[#141833] border border-white/10 rounded-3xl p-10 text-center">
                        <p className="font-display font-semibold text-lg mb-2">
                            Все още няма добавени предмети за този клас
                        </p>
                        <p className="text-[#9CA3C4] text-sm">Добавяме нови всяка седмица — наглеждай тук.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        {subjects.map((subject, i) => {
                            const sm = metaFor(subject.name, i);
                            return (
                                <Link
                                    key={subject.id}
                                    href={`/klas/${grade}/${subject.id}`}
                                    className="group relative bg-[#141833] border border-white/10 rounded-3xl p-6 text-center hover:border-white/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                >
                                    <div
                                        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300"
                                        style={{ backgroundColor: sm.color }}
                                    />
                                    <div
                                        className="relative mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm border-2 group-hover:scale-110 transition-transform duration-300"
                                        style={{ borderColor: sm.color, color: sm.color }}
                                    >
                                        {sm.symbol}
                                    </div>
                                    <div className="relative font-display text-sm font-bold leading-snug">
                                        {subject.name}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}