import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function Crumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Пътека" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-sm text-ink-soft">
                {items.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                        {i > 0 && (
                            <svg viewBox="0 0 8 12" className="h-3 w-2 text-ink-soft/60" aria-hidden="true">
                                <path d="M1.5 1.5L6 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        {c.href ? (
                            <Link href={c.href} className="marker-line font-medium hover:text-ink">
                                {c.label}
                            </Link>
                        ) : (
                            <span aria-current="page" className="font-semibold text-ink">
                                {c.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
