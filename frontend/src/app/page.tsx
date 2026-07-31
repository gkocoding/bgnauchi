"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUsername, logout } from "@/lib/auth";

const grades = [
  { num: 4, label: "начален етап", x: 10, y: 68 },
  { num: 7, label: "прогимназия", x: 37, y: 34 },
  { num: 10, label: "гимназия", x: 64, y: 50 },
  { num: 12, label: "матура", x: 90, y: 20 },
];

const features = [
  { title: "Истински формат", text: "Тестове по структурата на реалните матури — не произволни въпроси.", coord: "ФОРМАТ · МАТУРА" },
  { title: "Мигновен резултат", text: "Виждаш кое е вярно веднага, без да чакаш проверка.", coord: "ПРОВЕРКА · 0 СЕК" },
  { title: "Твоят напредък", text: "Всеки решен тест се пази, за да следиш подобрението си.", coord: "ПРОФИЛ · АКТИВЕН" },
];

// Генерира path между два node-а (леко извита линия)
function pathBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 6;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUsername(getUsername());
  }, []);

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setUsername(null);
    router.push("/");
  }

  return (
    <div className="bg-[#0B0E1A] text-[#EDEFF7] min-h-screen relative overflow-hidden">
      <div className="starfield" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-[#4FD1C5] opacity-[0.07] blur-[100px]" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-[#A78BFA] opacity-[0.08] blur-[100px]" />

      {/* NAVBAR */}
      <nav className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-xl font-bold tracking-wide">
          bg<span className="text-[#4FD1C5]">научи</span>
        </span>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <Link
                href="/profile"
                className="bg-[#141833] font-display text-xs font-medium px-4 py-2 rounded-full border border-white/10 hover:border-[#4FD1C5]/50 transition-colors"
              >
                ✦ {username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#9CA3C4] text-sm font-medium px-3 hover:text-[#EDEFF7] transition-colors"
              >
                Изход
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#9CA3C4] text-sm font-medium px-3 hover:text-[#EDEFF7] transition-colors"
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="bg-[#141833] font-display text-xs font-medium px-4 py-2 rounded-full border border-white/10 hover:border-[#4FD1C5]/50 transition-colors"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F2C14E] mb-8 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E] pulse-node" />
          КООРДИНАТИ: МАТУРА 20{new Date().getFullYear().toString().slice(-2)}
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.15] mb-6">
          Твоят път през<br />
          <span className="bg-gradient-to-r from-[#4FD1C5] to-[#A78BFA] bg-clip-text text-transparent">
            училището, картографиран
          </span>
        </h1>
        <p className="text-[#9CA3C4] text-lg max-w-xl mx-auto leading-relaxed">
          Тестове и задачи за българските ученици от 4 до 12 клас — всеки клас е стъпка от твоя път към матурата.
        </p>
      </section>

{/* CONSTELLATION MAP */}
      <section id="klas-map" className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="relative w-full" style={{ paddingBottom: "45%" }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full overflow-visible"
          >
            {grades.slice(0, -1).map((g, i) => {
              const next = grades[i + 1];
              return (
                <path
                  key={g.num}
                  d={pathBetween(g, next)}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="0.4"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className="constellation-line"
                />
              );
            })}
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>

          {grades.map((g) => (
            <Link
              key={g.num}
              href={`/klas/${g.num}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${g.x}%`, top: `${g.y}%` }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#F2C14E] opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 scale-[2.5]" />
                <div className="pulse-node relative w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#141833] border-2 border-[#F2C14E] flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />
                </div>
              </div>
              <div className="mt-3 bg-[#141833]/90 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2 text-center group-hover:border-[#4FD1C5]/50 transition-colors">
                <div className="font-display text-lg font-bold">{g.num}</div>
                <div className="text-[10px] uppercase tracking-wide text-[#9CA3C4] whitespace-nowrap">{g.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-14">
            Защо bg<span className="text-[#4FD1C5]">научи</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#141833] border border-white/10 rounded-3xl p-7 hover:border-[#4FD1C5]/30 transition-colors duration-300"
              >
                <div className="font-mono text-[11px] text-[#F2C14E] mb-4 tracking-wider">{f.coord}</div>
                <h3 className="font-display text-lg font-bold mb-3">{f.title}</h3>
                <p className="text-[#9CA3C4] text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-5">Готов ли си да тръгнеш? 🚀</h2>
          <p className="text-[#9CA3C4] mb-10">Избери своя клас горе и реши първия тест сега — безплатно.</p>
<Link
              href="#klas-map"
              className="group relative inline-flex items-center gap-2 font-display font-bold text-sm bg-[#F2C14E] text-[#0B0E1A] px-8 py-4 rounded-full hover:scale-105 transition-transform duration-300"
          >
            Започни сега
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>

      <footer className="relative z-10 py-10 text-center text-xs font-mono text-[#9CA3C4]/60 tracking-wider">
        bgnauchi.me · координати: България
      </footer>
    </div>
  );
}