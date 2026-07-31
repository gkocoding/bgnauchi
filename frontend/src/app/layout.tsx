import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bgnauchi.me — Подготовка за матури",
  description: "Тестове и материали за матури и кандидатстудентски изпити",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="bg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
            href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
            rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      </html>
  );
}