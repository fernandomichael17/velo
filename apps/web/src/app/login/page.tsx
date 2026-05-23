"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await signIn.email({
            email,
            password,
        });

        if (error) {
            setError(error.message || "Login gagal");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    return (
        <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
            <h1>Login ke velo</h1>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ display: "block", width: "100%", padding: 8 }}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ display: "block", width: "100%", padding: 8 }}
                    />
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? "Memuat..." : "Masuk"}
                </button>
            </form>
            <p>
                Belum punya akun? <a href="/register">Daftar</a>
            </p>
        </div>
    );
}
