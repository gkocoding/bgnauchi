import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bgнаучи — Подготовка за матури",
  description: "Тестове за 4., 7., 10. и 12. клас във формата на истинските изпити. Резултатът излиза веднага.",
};

export const viewport: Viewport = {
  themeColor: "#F6F8FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500..700&family=Geologica:wght@400..800&family=Literata:opsz,wght@7..72,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
