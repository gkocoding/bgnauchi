import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "БГнаучи | Начало",
        template: "БГнаучи | %s",
    },
    description:
        "Интерактивна платформа за подготовка за НВО (4., 7., 10. клас) и ДЗИ (12. клас) по БЕЛ и Математика.",
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/logo.svg", type: "image/svg+xml" },
        ],
        shortcut: ["/favicon.svg"],
        apple: [
            { url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" },
        ],
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: "#FFFFFF",
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