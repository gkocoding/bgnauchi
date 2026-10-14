"use client";

import React from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

/**
 * Поправя често срещани печатни грешки при въвеждане на формули
 * (напр. /frac -> \frac, /sqrt -> \sqrt, /cdot -> \cdot)
 */
function normalizeMathTypos(input: string): string {
    return input.replace(
        /(^|[\s([{\-+*=])\/(frac|sqrt|cdot|times|pi|alpha|beta|gamma|sin|cos|tg|cotg|log|ln|le|ge|neq|pm|infty)\b/g,
        "$1\\$2"
    );
}

/**
 * Прочита група от вложени фигурни скоби { ... }, независимо колко нива навътре има
 */
function readBraceGroup(str: string, start: number): [string, number] {
    let depth = 0;
    for (let j = start; j < str.length; j++) {
        if (str[j] === "{") depth++;
        else if (str[j] === "}") {
            depth--;
            if (depth === 0) {
                return [str.slice(start, j + 1), j + 1];
            }
        }
    }
    return [str.slice(start), str.length];
}

/**
 * Прочита незадължителна група в квадратни скоби [ ... ], напр. \sqrt[3]{8}
 */
function readBracketGroup(str: string, start: number): [string, number] {
    let depth = 0;
    for (let j = start; j < str.length; j++) {
        if (str[j] === "[") depth++;
        else if (str[j] === "]") {
            depth--;
            if (depth === 0) {
                return [str.slice(start, j + 1), j + 1];
            }
        }
    }
    return [str.slice(start), str.length];
}

export function renderTextWithMath(rawText: string | null | undefined): React.ReactNode {
    if (!rawText) return null;
    const text = normalizeMathTypos(String(rawText));

    const nodes: React.ReactNode[] = [];
    let i = 0;
    let buffer = "";
    let key = 0;

    function flushBuffer() {
        if (buffer) {
            nodes.push(<span key={key++}>{buffer}</span>);
            buffer = "";
        }
    }

    while (i < text.length) {
        // 1. Блокова математика $$ ... $$
        if (text.startsWith("$$", i)) {
            const end = text.indexOf("$$", i + 2);
            if (end !== -1) {
                flushBuffer();
                const expr = text.slice(i + 2, end).trim();
                try {
                    nodes.push(<BlockMath key={key++} math={expr} />);
                } catch {
                    nodes.push(<InlineMath key={key++} math={expr} />);
                }
                i = end + 2;
                continue;
            }
        }

        // 2. Редова математика $ ... $
        if (text[i] === "$" && text[i + 1] !== "$") {
            const end = text.indexOf("$", i + 1);
            if (end !== -1) {
                flushBuffer();
                const expr = text.slice(i + 1, end).trim();
                try {
                    nodes.push(<InlineMath key={key++} math={expr} />);
                } catch {
                    nodes.push(<span key={key++}>{expr}</span>);
                }
                i = end + 1;
                continue;
            }
        }

        // 3. Редова математика \( ... \)
        if (text.startsWith("\\(", i)) {
            const end = text.indexOf("\\)", i + 2);
            if (end !== -1) {
                flushBuffer();
                const expr = text.slice(i + 2, end).trim();
                try {
                    nodes.push(<InlineMath key={key++} math={expr} />);
                } catch {
                    nodes.push(<span key={key++}>{expr}</span>);
                }
                i = end + 2;
                continue;
            }
        }

        // 4. Директни LaTeX команди без долари (напр. \frac{5\sqrt{5}-\sqrt{45}}{\sqrt{5}})
        if (text[i] === "\\" && /[a-zA-Z]/.test(text[i + 1] || "")) {
            let j = i + 1;
            while (j < text.length && /[a-zA-Z]/.test(text[j])) j++;
            let mathExpr = text.slice(i, j);

            // Ако има [степен на корен], напр. \sqrt[3]{x}
            if (text[j] === "[") {
                const [bGroup, nextIdx] = readBracketGroup(text, j);
                mathExpr += bGroup;
                j = nextIdx;
            }

            // Прочитаме всички аргументи във фигурни скоби { ... }{ ... } (вкл. вложени)
            let groupsRead = 0;
            while (groupsRead < 3 && text[j] === "{") {
                const [group, nextIndex] = readBraceGroup(text, j);
                mathExpr += group;
                j = nextIndex;
                groupsRead++;
            }

            // Ако след командата има степен или индекс (напр. \sin^2 x или x_1)
            while (j < text.length && (text[j] === "^" || text[j] === "_")) {
                mathExpr += text[j];
                j++;
                if (text[j] === "{") {
                    const [subGroup, nextIndex] = readBraceGroup(text, j);
                    mathExpr += subGroup;
                    j = nextIndex;
                } else if (j < text.length && /[a-zA-Z0-9]/.test(text[j])) {
                    mathExpr += text[j];
                    j++;
                }
            }

            flushBuffer();
            try {
                nodes.push(<InlineMath key={key++} math={mathExpr} />);
            } catch {
                nodes.push(<span key={key++}>{mathExpr}</span>);
            }
            i = j;
            continue;
        }

        // 5. Самостоятелни променливи със степен или индекс (напр. x^2, a_1, 10^{-3})
        if (/[a-zA-Z0-9)]/.test(text[i]) && (text[i + 1] === "^" || text[i + 1] === "_")) {
            let startVar = i;
            while (
                buffer.length > 0 &&
                /[a-zA-Z0-9]/.test(buffer[buffer.length - 1])
            ) {
                buffer = buffer.slice(0, -1);
                startVar--;
            }
            flushBuffer();

            let j = i + 1;
            while (j < text.length && (text[j] === "^" || text[j] === "_")) {
                j++;
                if (text[j] === "{") {
                    const [, nextIdx] = readBraceGroup(text, j);
                    j = nextIdx;
                } else {
                    while (j < text.length && /[a-zA-Z0-9\-+]/.test(text[j])) j++;
                }
            }
            const expr = text.slice(startVar, j);
            try {
                nodes.push(<InlineMath key={key++} math={expr} />);
            } catch {
                nodes.push(<span key={key++}>{expr}</span>);
            }
            i = j;
            continue;
        }

        buffer += text[i];
        i++;
    }

    flushBuffer();
    return nodes;
}

export default function MathText({
    text,
    className,
}: {
    text: string | null | undefined;
    className?: string;
}) {
    return <span className={className}>{renderTextWithMath(text)}</span>;
}