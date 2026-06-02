const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = {
    async get<T>(path: string): Promise<T> {
        const res = await fetch(`${API_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error(await res.text() || "Terjadi kesalahan pada server");
        }
        return res.json();
    },

    async post<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error(await res.text() || "Gagal mengirim data ke server");
        }
        return res.json();
    },

    async patch<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${API_URL}${path}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error(await res.text() || "Gagal memperbarui data di server");
        }
        return res.json();
    },

    async del(path: string): Promise<void> {
        const res = await fetch(`${API_URL}${path}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error(await res.text() || "Gagal menghapus data di server");
        }
    },
};