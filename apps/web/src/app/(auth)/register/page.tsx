"use client";

import { useState } from "react";
import { signUp, signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await signUp.email({
            name,
            email,
            password,
        });

        if (error) {
            setError(error.message || "Registrasi gagal");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    return (
        <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
            <h1>Daftar di velo</h1>
            
            <div style={{ marginBottom: 16 }}>
                <button
                    type="button"
                    onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
                    style={{ width: "100%", padding: "10px", cursor: "pointer", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
                >
                    Daftar dengan Google
                </button>
            </div>
            
            <div style={{ textAlign: "center", marginBottom: 16, fontSize: "12px", color: "#666" }}>
                ATAU DENGAN EMAIL
            </div>

            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 16 }}>
                    <label>Nama</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ display: "block", width: "100%", padding: 8 }}
                    />
                </div>
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
                        minLength={8}
                        style={{ display: "block", width: "100%", padding: 8 }}
                    />
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? "Memuat..." : "Daftar"}
                </button>
            </form>
            <p>
                Sudah punya akun? <a href="/login">Masuk</a>
            </p>
        </div>
    );
}