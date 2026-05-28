"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconPlus, IconBuildingCommunity, IconLogout } from "@tabler/icons-react";

export default function DashboardPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [newWorkspace, setNewWorkspace] = useState({ name: "", slug: "" });
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    const fetchWorkspaces = async () => {
        const res = await fetch("http://localhost:3001/api/workspaces", {
            credentials: "include",
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
        setCreating(true);
        const res = await fetch("http://localhost:3001/api/workspaces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newWorkspace),
        });

        if (res.ok) {
            setNewWorkspace({ name: "", slug: "" });
            setShowForm(false);
            fetchWorkspaces();
        } else {
            alert("Gagal membuat workspace. Slug mungkin sudah digunakan.");
        }
        setCreating(false);
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-400">Memuat...</div>
            </div>
        );
    }
    if (!session) return null;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Halo, {session.user.name} 👋
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Kelola workspace dan proyek kamu dari sini.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { signOut(); router.push("/login"); }}
                    className="text-gray-600"
                >
                    <IconLogout size={16} className="mr-2" />
                    Keluar
                </Button>
            </div>

            {/* Workspaces Section */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-medium">Workspaces Kamu</h2>
                <Button
                    size="sm"
                    className="bg-velo-blue hover:bg-blue-deep"
                    onClick={() => setShowForm(!showForm)}
                >
                    <IconPlus size={16} className="mr-1" />
                    Buat Workspace
                </Button>
            </div>

            {/* Create Workspace Form */}
            {showForm && (
                <Card className="mb-6 border-velo-blue/20 bg-blue-light/30">
                    <CardHeader>
                        <CardTitle className="text-base">Workspace Baru</CardTitle>
                        <CardDescription>
                            Buat workspace untuk tim atau proyek kamu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateWorkspace} className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="ws-name">Nama</Label>
                                <Input
                                    id="ws-name"
                                    placeholder="Tim Engineering"
                                    value={newWorkspace.name}
                                    onChange={(e) =>
                                        setNewWorkspace({ ...newWorkspace, name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="ws-slug">Slug</Label>
                                <Input
                                    id="ws-slug"
                                    placeholder="tim-engineering"
                                    value={newWorkspace.slug}
                                    onChange={(e) =>
                                        setNewWorkspace({ ...newWorkspace, slug: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="bg-velo-blue hover:bg-blue-deep"
                                disabled={creating}
                            >
                                {creating ? "Membuat..." : "Buat"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Workspace List */}
            {workspaces.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <IconBuildingCommunity size={40} className="text-gray-300 mb-3" />
                        <p className="text-gray-400 text-sm">
                            Belum ada workspace. Buat yang pertama!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {workspaces.map((ws: any) => (
                        <Card
                            key={ws.id}
                            className="hover:border-velo-blue/30 transition-colors cursor-pointer"
                        >
                            <CardContent className="flex items-center gap-4 py-4">
                                <div className="w-10 h-10 rounded-lg bg-velo-blue flex items-center justify-center text-white font-bold text-sm">
                                    {ws.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{ws.name}</p>
                                    <p className="text-xs text-gray-400">@{ws.slug}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-light text-velo-blue font-medium">
                                    {ws.role}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}