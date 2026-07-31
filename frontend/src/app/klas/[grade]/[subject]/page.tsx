import Link from "next/link";

type Subject = {
    id: number;
    name: string;
};

type Question = {
    id: number;
    text: string;
};

type Exam = {
    id: number;
    title: string;
    exam_type: string;
    grade: number;
    subject: Subject;
    questions: Question[];
};

const gradeMeta: Record<string, { label: string }> = {
    "4": { label: "начален етап" },
    "7": { label: "прогимназия" },
    "10": { label: "гимназия" },
    "12": { label: "матура" },
};

async function getExamsForSubject(grade: string, subjectId: string): Promise<{ exams: Exam[]; subjectName: string | null }> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/?grade=${grade}&subject=${subjectId}`, {
        cache: "no-store",
    });
    if (!res.ok) return { exams: [], subjectName: null };

    const exams: Exam[] = await res.json();
    const subjectName = exams.length > 0 ? exams[0].subject.name : null;

    return { exams, subjectName };
}

export default async function SubjectPage({
    params,
}: {
    params: Promise<{ grade: string; subject: string }>;
}) {
    const { grade, subject } = await params;
    const { exams, subjectName } = await getExamsForSubject(grade, subject);
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
                    href={`/klas/${grade}`}
                    className="flex items-center gap-1.5 bg-[#141833] border border-white/10 text-sm font-medium px-4 py-2 rounded-full hover:border-[#4FD1C5]/50 transition-colors"
                >
                    ← Предмети
                </Link>
            </nav>

            {/* Breadcrumb пътека — ясен път назад през всяко ниво */}
            <div className="relative z-10 max-w-3xl mx-auto px-6">
                <div className="flex items-center flex-wrap gap-2 text-sm font-mono text-[#9CA3C4] mb-2">
                    <Link href="/" className="hover:text-[#4FD1C5] transition-colors">
                        Начало
                    </Link>
                    <span className="text-white/20">/</span>
                    <Link href={`/klas/${grade}`} className="hover:text-[#4FD1C5] transition-colors">
                        {grade}. клас
                    </Link>
                    <span className="text-white/20">/</span>
                    <span className="text-[#EDEFF7]">{subjectName ?? "Предмет"}</span>
                </div>
            </div>

            <section className="relative z-10 max-w-3xl mx-auto px-6 pt-6 pb-14 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F2C14E] mb-6 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E] pulse-node" />
                    СЕКТОР: {grade}. КЛАС · {meta.label.toUpperCase()}
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
                    {subjectName ?? "Предмет"}
                </h1>
                <p className="text-[#9CA3C4] text-lg max-w-xl mx-auto">
                    Избери тест по-долу и виж какво знаеш — резултатът излиза веднага.
                </p>
            </section>

            <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
                {exams.length === 0 ? (
                    <div className="bg-[#141833] border border-white/10 rounded-3xl p-10 text-center">
                        <p className="font-display font-semibold text-lg mb-2">
                            Все още няма готови тестове по този предмет
                        </p>
                        <p className="text-[#9CA3C4] text-sm">Добавяме нови всяка седмица — наглеждай тук.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-5">
                        {exams.map((exam) => (
                            <Link
                                key={exam.id}
                                href={`/test/${exam.id}`}
                                className="group relative bg-[#141833] border border-white/10 rounded-3xl p-6 hover:border-[#4FD1C5]/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#4FD1C5] opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-300" />
                                <div className="relative">
                                    <div className="font-mono text-[11px] text-[#F2C14E] mb-2 tracking-wider">
                                        {exam.exam_type === "matura" ? "МАТУРА" : "КАНДИДАТСТУДЕНТСКИ"}
                                    </div>
                                    <div className="font-display text-lg font-bold mb-1">{exam.title}</div>
                                    <div className="text-sm text-[#9CA3C4] font-mono">{exam.questions.length} въпроса</div>
                                </div>
                                <div className="relative text-2xl text-[#4FD1C5] group-hover:translate-x-1 transition-transform duration-300">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}