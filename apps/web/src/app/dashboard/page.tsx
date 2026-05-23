"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    if (isPending) return <p>Memuat...</p>;
    if (!session) return null;

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <div style={{ maxWidth: 600, margin: "100px auto", padding: 24 }}>
            <h1>Dashboard</h1>
            <p>Selamat datang, {session.user.name}!</p>
            <p>Email: {session.user.email}</p>
            <button onClick={handleLogout}>Keluar</button>
        </div>
    );
}