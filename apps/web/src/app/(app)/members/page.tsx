"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { IconPlus, IconUsers, IconBuildingCommunity, IconMail } from "@tabler/icons-react";

interface Workspace {
    id: string;
    name: string;
    slug: string;
    role: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: "owner" | "admin" | "member" | "viewer";
    joinedAt: string;
}

export default function MembersPage() {
    const { data: session, isPending: sessionPending } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    // Ambil ID workspace aktif dari localStorage saat mount
    useEffect(() => {
        const savedWsId = localStorage.getItem("active_workspace_id");
        if (savedWsId) {
            setActiveWorkspaceId(savedWsId);
        }
    }, []);

    // Proteksi login
    useEffect(() => {
        if (!sessionPending && !session) {
            router.push("/login");
        }
    }, [session, sessionPending, router]);

    // 1. Query untuk mengambil seluruh workspace user
    const { data: workspaces = [] } = useQuery<Workspace[]>({
        queryKey: ["workspaces"],
        queryFn: () => api.get<Workspace[]>("/api/workspaces"),
        enabled: !!session,
    });

    // Menentukan workspace aktif
    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

    // Sinkronkan activeWorkspaceId jika kosong
    useEffect(() => {
        if (workspaces.length > 0 && !activeWorkspaceId) {
            setActiveWorkspaceId(workspaces[0].id);
            localStorage.setItem("active_workspace_id", workspaces[0].id);
        }
    }, [workspaces, activeWorkspaceId]);

    // 2. Query untuk mengambil daftar anggota di workspace aktif
    const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
        queryKey: ["members", activeWorkspace?.id],
        queryFn: () => api.get<Member[]>(`/api/workspaces/${activeWorkspace?.id}/members`),
        enabled: !!activeWorkspace,
    });

    // 3. Mutation untuk mengundang anggota baru
    const inviteMemberMutation = useMutation({
        mutationFn: (email: string) =>
            api.post(`/api/workspaces/${activeWorkspace?.id}/members`, { email }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members", activeWorkspace?.id] });
            setInviteEmail("");
            setInviteDialogOpen(false);
        },
        onError: (err: any) => {
            alert(err.message || "Gagal mengundang anggota");
        },
    });

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        inviteMemberMutation.mutate(inviteEmail);
    };

    if (sessionPending || membersLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-400">Memuat anggota workspace...</div>
            </div>
        );
    }

    if (!session || !activeWorkspace) return null;

    // Memeriksa apakah user yang login memiliki hak untuk mengundang (Owner/Admin)
    const canInvite = activeWorkspace.role === "owner" || activeWorkspace.role === "admin";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Anggota Tim</h1>
                    <p className="text-gray-400 text-xs mt-1">
                        Kelola kolaborator dan role anggota di workspace **{activeWorkspace.name}**.
                    </p>
                </div>

                {canInvite && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-velo-blue hover:bg-blue-deep text-white">
                                <IconPlus size={16} className="mr-1" />
                                Undang Anggota
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleInviteSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Undang Rekan Tim</DialogTitle>
                                    <DialogDescription>
                                        Masukkan alamat email rekan tim yang sudah terdaftar untuk dimasukkan ke workspace ini.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="invite-email">Alamat Email</Label>
                                        <div className="relative">
                                            <Input
                                                id="invite-email"
                                                type="email"
                                                placeholder="rekan@velo.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="pl-9"
                                                required
                                            />
                                            <IconMail
                                                size={16}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setInviteDialogOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-velo-blue hover:bg-blue-deep"
                                        disabled={inviteMemberMutation.isPending}
                                    >
                                        {inviteMemberMutation.isPending ? "Mengundang..." : "Kirim Undangan"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Members List */}
            {members.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <IconUsers size={40} className="text-gray-300 mb-3" />
                        <p className="text-gray-400 text-sm">Belum ada anggota.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {members.map((member) => (
                        <Card key={member.id} className="hover:border-gray-300 transition-colors">
                            <CardContent className="flex items-center gap-4 py-3.5">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-blue-light text-velo-blue flex items-center justify-center font-bold text-sm">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Profil Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-ink truncate">{member.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                </div>

                                {/* Badge Status / Role */}
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${member.role === "owner" ? "bg-red-50 text-red-700 border-red-200" :
                                            member.role === "admin" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                "bg-blue-50 text-velo-blue border-blue-200"
                                        }`}>
                                        {member.role === "owner" ? "Owner" :
                                            member.role === "admin" ? "Admin" : "Anggota"}
                                    </span>
                                    <span className="text-[10px] text-gray-400 hidden sm:inline">
                                        Gabung {new Date(member.joinedAt).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}