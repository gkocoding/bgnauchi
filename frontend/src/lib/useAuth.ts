"use client";

import { useSyncExternalStore } from "react";
import { isLoggedIn, getUsername } from "./auth";

// Малък "магазин", който следи дали има логнат потребител (токените са в localStorage).
const listeners = new Set<() => void>();

export function notifyAuthChange() {
    listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
    };
}

// null = не е логнат; иначе потребителското име
export function useAuthName(): string | null {
    return useSyncExternalStore(
        subscribe,
        () => (isLoggedIn() ? getUsername() ?? "" : null),
        () => null
    );
}
