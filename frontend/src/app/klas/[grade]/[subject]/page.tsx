import Link from "next/link";
import Nav from "@/components/Nav";
import Crumbs from "@/components/Crumbs";
import SubjectIcon from "@/components/SubjectIcon";
import { examTypeLabel, metaFor } from "@/lib/subjects";
import type { CSSProperties } from "react";

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
    question_count: number;
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

function questionsWord(n: number) {
    return n === 1 ? "1 въпрос" : `${n} въпроса`;
}

export default async function SubjectPage({
    params,
}: {
    params: Promise<{ grade: string; subject: string }>;
}) {
    const { grade, subject } = await params;
    const { exams, subjectName } = await getExamsForSubject(grade, subject);
    const sm = metaFor(subjectName ?? "", Number(subject) || 0);

    return (
        <>
            <Nav />

            <main className="mx-auto max-w-6xl px-5 pb-24 pt-2">
                <Crumbs
                    items={[
                        { label: "Начало", href: "/" },
                        { label: `${grade}. клас`, href: `/klas/${grade}` },
                        { label: subjectName ?? "Предмет" },
                    ]}
                />

                <header className="mb-12 flex items-center gap-5">
                    <span
                        className="stamp-in grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-[3px] border-ink shadow-pop-sm sm:h-24 sm:w-24"
                        style={{ background: sm.tint }}
                    >
                        <SubjectIcon kind={sm.icon} name={subjectName ?? "?"} className="h-11 w-11 sm:h-14 sm:w-14" />
                    </span>
                    <div>
                        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                            {subjectName ?? "Предмет"}
                        </h1>
                        <p className="mt-2 font-hand text-[1.6rem] font-semibold leading-none text-cobalt-deep">
                            Избери тест и виж какво знаеш
                        </p>
                    </div>
                </header>

                {exams.length === 0 ? (
                    <div className="sheet mx-auto max-w-xl border-dashed p-10 text-center">
                        <p className="mb-2 font-display text-xl font-bold">Все още няма тестове по този предмет</p>
                        <p className="mb-7 text-ink-soft">Добавяме нови всяка седмица. Провери пак скоро.</p>
                        <Link href={`/klas/${grade}`} className="btn btn-white">
                            Към другите предмети
                        </Link>
                    </div>
                ) : (
                    <ul className="max-w-3xl space-y-6">
                        {exams.map((exam, i) => (
                            <li
                                key={exam.id}
                                className="drop-in"
                                style={{ "--i": i, "--r": i % 2 === 0 ? "-1.5deg" : "1.5deg" } as CSSProperties}
                            >
                                <Link href={`/test/${exam.id}`} className="ticket">
                                    <div className="px-5 py-5 sm:px-7 sm:py-6">
                                        <span
                                            className="mb-3 inline-block rounded-full border-2 border-ink px-3 py-0.5 font-display text-xs font-semibold"
                                            style={{ background: exam.exam_type === "matura" ? "#FFF4BF" : "#E4EAFF" }}
                                        >
                                            {examTypeLabel(exam.exam_type)}
                                        </span>
                                        <div className="font-display text-xl font-bold leading-snug sm:text-2xl">
                                            {exam.title}
                                        </div>
                                        <div className="mt-1.5 font-display text-sm font-medium text-ink-soft">
                                            {questionsWord(exam.question_count)}
                                        </div>
                                    </div>
                                    <div className="stub">
                                        <span>Започни</span>
                                        <svg viewBox="0 0 24 24" className="arrow h-6 w-6" aria-hidden="true">
                                            <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </>
    );
}
