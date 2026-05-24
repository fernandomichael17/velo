"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [newWorkspace, setNewWorkspace] = useState({ name: "", slug: "" });

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    const fetchWorkspaces = async () => {
        // Memakai credentials: "include" agar cookie (token) dikirim ke API server
        const res = await fetch("http://localhost:3001/api/workspaces", {
            credentials: "include"
        });
        if (res.ok) {
            const data = await res.json();
            setWorkspaces(data);
        }
    };

    useEffect(() => {
        if (session) {
            fetchWorkspaces();
        }
    }, [session]);

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("http://localhost:3001/api/workspaces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newWorkspace),
        });

        if (res.ok) {
            setNewWorkspace({ name: "", slug: "" });
            fetchWorkspaces(); // Reload list
        } else {
            alert("Gagal membuat workspace, mungkin slug sudah ada");
        }
    };

    if (isPending) return <p>Memuat...</p>;
    if (!session) return null;

    return (
        <div style={{ maxWidth: 800, margin: "50px auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Dashboard</h1>
                <button onClick={() => { signOut(); router.push("/login"); }}>Keluar</button>
            </div>
            <p>Halo, {session.user.name}</p>

            <hr style={{ margin: "24px 0" }} />

            <h2>Workspaces Kamu</h2>
            <ul>
                {workspaces.map((ws: any) => (
                    <li key={ws.id}>
                        <strong>{ws.name}</strong> (@{ws.slug}) — Role: {ws.role}
                    </li>
                ))}
            </ul>
            {workspaces.length === 0 && <p>Belum ada workspace.</p>}

            <h3 style={{ marginTop: 24 }}>Buat Workspace Baru</h3>
            <form onSubmit={handleCreateWorkspace} style={{ display: "flex", gap: 12 }}>
                <input
                    placeholder="Nama Tim"
                    value={newWorkspace.name}
                    onChange={e => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    required
                />
                <input
                    placeholder="Slug (unik, cth: tim-keren)"
                    value={newWorkspace.slug}
                    onChange={e => setNewWorkspace({ ...newWorkspace, slug: e.target.value })}
                    required
                />
                <button type="submit">Buat</button>
            </form>
        </div>
    );
}