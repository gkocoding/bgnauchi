// frontend/src/lib/api.ts

import { getAccessToken, refreshAccessToken, logout } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(`${API_URL}${path}`, { ...options, headers });

    // Ако токенът е изтекъл, опитваме да го обновим веднъж и пак пробваме
    if (res.status === 401 && token) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            const newToken = getAccessToken();
            res = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: { ...headers, Authorization: `Bearer ${newToken}` },
            });
        } else {
            logout();
        }
    }

    return res;
}