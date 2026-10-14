export default function Steps() {
    const steps = [
        {
            num: "01",
            title: "Избери етап и реален изпитен модул",
            desc: "Всички тестове са структурирани по официалните програми на МОН за 4., 7., 10. и 12. клас с реален таймер и справочни формули.",
            tag: "Симулация на изпит",
        },
        {
            num: "02",
            title: "Решавай в чиста среда без разсейване",
            desc: "Висококонтрастен интерфейс с вградена дигитална чернова, маркиране на въпроси за преглед и бърза навигация с клавиатура.",
            tag: "Фокус режим",
        },
        {
            num: "03",
            title: "Анализирай грешките и слабите си теми",
            desc: "Получаваш приравнена оценка по МОН, разбивка по учебни теми и разписано решение стъпка по стъпка за всяка задача.",
            tag: "Персонална аналитика",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
                <div
                    key={s.num}
                    className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#F8FAFC] p-7 transition-all hover:border-slate-300 hover:bg-white hover:shadow-lg"
                >
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-display text-xs font-bold text-blue-700">
                                {s.tag}
                            </span>
                            <span className="font-display text-2xl font-black tracking-tighter text-slate-300">
                                {s.num}
                            </span>
                        </div>
                        <h3 className="mt-5 font-display text-lg font-extrabold leading-snug text-slate-950">
                            {s.title}
                        </h3>
                        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                            {s.desc}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}