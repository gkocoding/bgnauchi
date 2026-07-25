"use client";

import { useState } from "react";
import Link from "next/link";

const grades = [
  { num: 4, label: "начален етап", emoji: "🌱", color: "#5AC8D8" },
  { num: 7, label: "прогимназия", emoji: "📘", color: "#FFC857" },
  { num: 10, label: "гимназия", emoji: "🎯", color: "#FF6B4A" },
  { num: 12, label: "матура", emoji: "🎓", color: "#8B7FD8" },
];

const features = [
  { emoji: "✅", title: "Истински формат", text: "Тестове по структурата на реалните матури — не произволни въпроси." },
  { emoji: "⚡", title: "Мигновен резултат", text: "Виждаш кое е вярно веднага, без да чакаш проверка." },
  { emoji: "📈", title: "Твоят напредък", text: "Всеки решен тест се пази, за да следиш подобрението си." },
];

export default function Home() {
  const [dark, setDark] = useState(true);

  const bg = dark ? "bg-[#20202B]" : "bg-[#FFF8F0]";
  const text = dark ? "text-[#FFF8F0]" : "text-[#2D2A26]";
  const subtext = dark ? "text-[#B8B4AC]" : "text-[#7A756B]";
  const cardBg = dark ? "bg-[#2A2A38]" : "bg-white";

  return (
      <div className={bg + " " + text + " min-h-screen transition-colors duration-300 overflow-hidden relative"}>
        <div className="floaty absolute top-20 left-10 w-32 h-32 rounded-full bg-[#FFC857] opacity-20 blur-2xl"></div>
        <div className="floaty absolute top-96 right-10 w-40 h-40 rounded-full bg-[#5AC8D8] opacity-20 blur-2xl" style={{ animationDelay: "2s" }}></div>
        <div className="floaty absolute bottom-40 left-1/3 w-24 h-24 rounded-full bg-[#FF6B4A] opacity-20 blur-2xl" style={{ animationDelay: "4s" }}></div>

        <nav className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-2xl font-bold">
          bg<span className="text-[#FF6B4A]">научи</span> 🎈
        </span>
          <button
              onClick={() => setDark(!dark)}
              className={cardBg + " font-display text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:scale-105 transition-transform"}
          >
            {dark ? "☀️ Светло" : "🌙 Тъмно"}
          </button>
        </nav>

        <section className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-block bg-[#FFC857] text-[#2D2A26] font-display font-semibold text-sm px-4 py-2 rounded-full mb-6 rotate-1">
            Матури · Кандидатстудентски 🎉
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Учи с усмивка,<br />
            <span className="text-[#FF6B4A]">изпитвай се с увереност</span>
          </h1>
          <p className={subtext + " text-lg max-w-xl mx-auto"}>
            Тестове и задачи за българските ученици от 4 до 12 клас — забавно, ясно и по формата на истинските изпити.
          </p>
        </section>

        <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
          <h2 className="font-display text-xl font-bold mb-6 text-center">Избери своя клас</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {grades.map((g) => (
                <Link
                    key={g.num}
                    href={"/klas/" + g.num}
                    className={cardBg + " rounded-3xl p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-2 hover:rotate-2 transition-all duration-300"}
                >
                  <div className="text-4xl mb-2">{g.emoji}</div>
                  <div className="font-display text-3xl font-extrabold mb-1" style={{ color: g.color }}>
                    {g.num}
                  </div>
                  <div className={"text-xs uppercase tracking-wide font-semibold " + subtext}>{g.label}</div>
                </Link>
            ))}
          </div>
        </section>

        <section className={cardBg + " relative z-10 rounded-t-[3rem]"}>
          <div className="max-w-5xl mx-auto px-6 py-24">
            <h2 className="font-display text-4xl font-extrabold text-center mb-14">Защо bgнаучи? 💡</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f) => (
                  <div key={f.title} className={bg + " rounded-3xl p-8 text-center hover:scale-105 transition-transform duration-300"}>
                    <div className="text-4xl mb-4">{f.emoji}</div>
                    <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
                    <p className={subtext + " text-sm leading-relaxed"}>{f.text}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        <section className={cardBg + " relative z-10"}>
          <div className="max-w-3xl mx-auto px-6 pb-24 text-center">
            <h2 className="font-display text-4xl font-extrabold mb-6">Готов ли си? 🚀</h2>
            <p className={subtext + " mb-8"}>Избери своя клас и реши първия тест сега — безплатно.</p>
            <Link
                href="#"
                className="inline-block font-display font-bold text-lg bg-[#FF6B4A] text-white px-10 py-4 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
            >
              Започни сега →
            </Link>
          </div>
        </section>

        <footer className={cardBg + " relative z-10 py-10 text-center text-sm rounded-t-none " + subtext}>
          bgnauchi.me · Направено с ❤️ за българските ученици
        </footer>
      </div>
  );
}