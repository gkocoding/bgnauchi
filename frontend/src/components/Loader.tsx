export default function Loader({ label = "Зареждане…" }: { label?: string }) {
    return (
        <div className="grid min-h-[60vh] place-items-center px-5">
            <div className="text-center" role="status">
                <svg width="132" height="52" viewBox="0 0 120 48" aria-hidden="true" className="mx-auto">
                    <path
                        d="M4 30 C 14 6, 24 6, 30 26 S 46 44, 56 22 S 76 4, 86 26 S 104 40, 116 14"
                        pathLength={1}
                        className="scribble"
                        fill="none"
                        stroke="#2B50E6"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>
                <p className="mt-2 font-display text-sm font-medium text-ink-soft">{label}</p>
            </div>
        </div>
    );
}
