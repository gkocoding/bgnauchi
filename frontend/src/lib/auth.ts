// frontend/src/lib/auth.ts

const ACCESS_KEY = "bgnauchi_access";
const REFRESH_KEY = "bgnauchi_refresh";
const USERNAME_KEY = "bgnauchi_username";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type AuthResult = {
    success: boolean;
    error?: string;
};

// --- Съхранение на токени ---

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
}

export function getUsername(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(USERNAME_KEY);
}

export function isLoggedIn(): boolean {
    return !!getAccessToken();
}

function saveSession(access: string, refresh: string, username: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USERNAME_KEY, username);
}

export function logout() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERNAME_KEY);
}

// --- Регистрация ---

export async function register(
    username: string,
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        const res = await fetch(`${API_URL}/api/auth/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const firstError =
                Object.values(data)[0]?.toString() || "Грешка при регистрация.";
            return { success: false, error: firstError };
        }

        return { success: true };
    } catch {
        return { success: false, error: "Няма връзка със сървъра." };
    }
}

// --- Вход ---

export async function login(username: string, password: string): Promise<AuthResult> {
    try {
        const res = await fetch(`${API_URL}/api/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            return { success: false, error: "Грешно потребителско име или парола." };
        }

        const data = await res.json();
        saveSession(data.access, data.refresh, data.username);
        return { success: true };
    } catch {
        return { success: false, error: "Няма връзка със сървъра." };
    }
}

// --- Обновяване на access token (ако е изтекъл) ---

export async function refreshAccessToken(): Promise<boolean> {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
        const res = await fetch(`${API_URL}/api/auth/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });

        if (!res.ok) {
            logout();
            return false;
        }

        const data = await res.json();
        localStorage.setItem(ACCESS_KEY, data.access);
        return true;
    } catch {
        return false;
    }
}