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

const gradeMeta: Record<string, { emoji: string; color: string; label: string }> = {
    "4": { emoji: "🌱", color: "#5AC8D8", label: "начален етап" },
    "7": { emoji: "📘", color: "#FFC857", label: "прогимназия" },
    "10": { emoji: "🎯", color: "#FF6B4A", label: "гимназия" },
    "12": { emoji: "🎓", color: "#8B7FD8", label: "матура" },
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
    const meta = gradeMeta[grade] ?? { emoji: "📚", color: "#FF6B4A", label: "клас " + grade };

    return (
        <div className="bg-[#20202B] text-[#FFF8F0] min-h-screen relative overflow-hidden">
            <div className="floaty absolute top-20 left-10 w-32 h-32 rounded-full bg-[#FFC857] opacity-20 blur-2xl"></div>
            <div className="floaty absolute bottom-40 right-1/4 w-40 h-40 rounded-full bg-[#5AC8D8] opacity-20 blur-2xl" style={{ animationDelay: "2s" }}></div>

            <nav className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                <Link href="/" className="font-display text-2xl font-bold">
                    bg<span className="text-[#FF6B4A]">научи</span> 🎈
                </Link>
                <Link
                    href={`/klas/${grade}`}
                    className="bg-[#2A2A38] font-display text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:scale-105 transition-transform"
                >
                    ← Предмети
                </Link>
            </nav>

            <section className="relative z-10 max-w-3xl mx-auto px-6 pt-10 pb-16 text-center">
                <div
                    className="inline-block text-[#2D2A26] font-display font-semibold text-sm px-4 py-2 rounded-full mb-6 -rotate-1"
                    style={{ backgroundColor: meta.color }}
                >
                    {meta.emoji} {meta.label}
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                    {subjectName ?? "Предмет"} — {grade}. клас
                </h1>
                <p className="text-[#B8B4AC] text-lg max-w-xl mx-auto">
                    Избери тест по-долу и виж какво знаеш — резултатът излиза веднага.
                </p>
            </section>

            <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
                {exams.length === 0 ? (
                    <div className="bg-[#2A2A38] rounded-3xl p-10 text-center shadow-md">
                        <div className="text-4xl mb-3">🛠️</div>
                        <p className="font-display font-semibold text-lg mb-2">
                            Все още няма готови тестове по този предмет
                        </p>
                        <p className="text-[#B8B4AC] text-sm">Добавяме нови всяка седмица — наглеждай тук.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {exams.map((exam) => (
                            <Link
                                key={exam.id}
                                href={`/test/${exam.id}`}
                                className="bg-[#2A2A38] rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-xs uppercase tracking-wide font-semibold text-[#B8B4AC] mb-1">
                                        {exam.exam_type === "matura" ? "Матура" : "Кандидатстудентски"}
                                    </div>
                                    <div className="font-display text-lg font-bold mb-1">{exam.title}</div>
                                    <div className="text-sm text-[#B8B4AC]">{exam.questions.length} въпроса</div>
                                </div>
                                <div className="text-3xl" style={{ color: meta.color }}>
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