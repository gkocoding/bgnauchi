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

const gradeMeta: Record<string, { emoji: string; color: string; label: string }> = {
    "5": { emoji: "🌱", color: "#5AC8D8", label: "начален етап" },
    "7": { emoji: "📘", color: "#FFC857", label: "прогимназия" },
    "10": { emoji: "🎯", color: "#FF6B4A", label: "гимназия" },
    "12": { emoji: "🎓", color: "#8B7FD8", label: "матура" },
};

const subjectEmoji: Record<string, string> = {
    "Математика": "🔢",
    "Български език и литература": "📖",
    "Английски език": "🇬🇧",
    "История": "🏛️",
    "География": "🌍",
    "Физика": "⚛️",
    "Химия": "🧪",
    "Биология": "🧬",
};

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
                    href="/"
                    className="bg-[#2A2A38] font-display text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:scale-105 transition-transform"
                >
                    ← Начало
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
                    Предмети за {grade}. клас
                </h1>
                <p className="text-[#B8B4AC] text-lg max-w-xl mx-auto">
                    Избери предмет, за да видиш наличните тестове.
                </p>
            </section>

            <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
                {subjects.length === 0 ? (
                    <div className="bg-[#2A2A38] rounded-3xl p-10 text-center shadow-md">
                        <div className="text-4xl mb-3">🛠️</div>
                        <p className="font-display font-semibold text-lg mb-2">
                            Все още няма добавени предмети за този клас
                        </p>
                        <p className="text-[#B8B4AC] text-sm">Добавяме нови всяка седмица — наглеждай тук.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <Link
                                key={subject.id}
                                href={`/klas/${grade}/${subject.id}`}
                                className="bg-[#2A2A38] rounded-3xl p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-2 hover:rotate-2 transition-all duration-300"
                            >
                                <div className="text-4xl mb-2">{subjectEmoji[subject.name] ?? "📚"}</div>
                                <div className="font-display text-base font-bold" style={{ color: meta.color }}>
                                    {subject.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}