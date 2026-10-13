import Link from "next/link";
import Nav from "@/components/Nav";
import Crumbs from "@/components/Crumbs";
import SubjectIcon from "@/components/SubjectIcon";
import { gradeLabel, metaFor } from "@/lib/subjects";
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

async function getExams(grade: string): Promise<Exam[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/?grade=${grade}`, {
        cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
}

function getUniqueSubjects(exams: Exam[]): (Subject & { tests: number })[] {
    const map = new Map<number, Subject & { tests: number }>();
    for (const exam of exams) {
        if (!exam.subject) continue;
        const found = map.get(exam.subject.id);
        if (found) found.tests += 1;
        else map.set(exam.subject.id, { ...exam.subject, tests: 1 });
    }
    return Array.from(map.values());
}

function testsWord(n: number) {
    return n === 1 ? "1 тест" : `${n} теста`;
}

export default async function KlasPage({
    params,
}: {
    params: Promise<{ grade: string }>;
}) {
    const { grade } = await params;
    const exams = await getExams(grade);
    const subjects = getUniqueSubjects(exams);

    return (
        <>
            <Nav />

            <main className="mx-auto max-w-6xl px-5 pb-24 pt-2">
                <Crumbs items={[{ label: "Начало", href: "/" }, { label: `${grade}. клас` }]} />

                <header className="mb-12 flex items-center gap-5 sm:gap-7">
                    <span className="stamp stamp-in !h-[5.5rem] !w-[5.5rem] !text-[2.8rem] sm:!h-28 sm:!w-28 sm:!text-[3.4rem]">
                        {grade}
                    </span>
                    <div>
                        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                            Избери предмет
                        </h1>
                        <p className="mt-2 font-hand text-[1.6rem] font-semibold leading-none text-cobalt-deep">
                            {grade}. клас · {gradeLabel(grade).toLowerCase()}
                        </p>
                    </div>
                </header>

                {subjects.length === 0 ? (
                    <div className="sheet mx-auto max-w-xl border-dashed p-10 text-center">
                        <p className="mb-2 font-display text-xl font-bold">Все още няма предмети за този клас</p>
                        <p className="mb-7 text-ink-soft">Добавяме нови тестове всяка седмица. Провери пак скоро.</p>
                        <Link href="/" className="btn btn-white">
                            Към другите класове
                        </Link>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((subject, i) => {
                            const sm = metaFor(subject.name, i);
                            const tilt = i % 2 === 0 ? "-3deg" : "3deg";
                            return (
                                <li
                                    key={subject.id}
                                    className="drop-in"
                                    style={{ "--i": i, "--r": tilt } as CSSProperties}
                                >
                                    <Link
                                        href={`/klas/${grade}/${subject.id}`}
                                        className="notebook"
                                        style={{ "--c": sm.color, "--t": sm.tint } as CSSProperties}
                                    >
                                        <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-white">
                                            <SubjectIcon kind={sm.icon} name={subject.name} className="h-8 w-8" />
                                        </span>
                                        <span>
                                            <span className="block font-display text-xl font-bold leading-snug">
                                                {subject.name}
                                            </span>
                                            <span className="mt-1 block font-hand text-[1.35rem] font-semibold leading-none">
                                                {testsWord(subject.tests)}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
        </>
    );
}
