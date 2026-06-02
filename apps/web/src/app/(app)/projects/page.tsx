"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPlus, IconFolder, IconBuildingCommunity, IconChevronDown, IconCalendar } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";

interface Workspace {
    id: string;
    name: string;
    slug: string;
    role: string;
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "paused" | "completed" | "archived";
    workspaceId: string;
    ownerId: string;
    startDate: string | null;
    dueDate: string | null;
    createdAt: string;
}

export default function ProjectsPage() {
    const { data: session, isPending: sessionPending } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form states
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        startDate: "",
        dueDate: "",
    });

    // Validasi session login
    useEffect(() => {
        if (!sessionPending && !session) {
            router.push("/login");
        }
    }, [session, sessionPending, router]);

    // 1. Query untuk mengambil semua workspace user
    const { data: workspaces = [], isLoading: workspacesLoading } = useQuery<Workspace[]>({
        queryKey: ["workspaces"],
        queryFn: () => api.get<Workspace[]>("/api/workspaces"),
        enabled: !!session,
    });

    // Set workspace pertama sebagai aktif secara default atau muat dari localStorage jika ada
    useEffect(() => {
        if (workspaces.length > 0) {
            const savedWsId = localStorage.getItem("active_workspace_id");
            const foundWs = workspaces.find((w) => w.id === savedWsId);
            if (foundWs) {
                setSelectedWorkspace(foundWs);
            } else {
                setSelectedWorkspace(workspaces[0]);
                localStorage.setItem("active_workspace_id", workspaces[0].id);
            }
        }
    }, [workspaces]);

    // 2. Query untuk mengambil daftar proyek berdasarkan workspace yang dipilih
    const { data: projectsData = [], isLoading: projectsLoading } = useQuery<Project[]>({
        queryKey: ["projects", selectedWorkspace?.id],
        queryFn: () => api.get<Project[]>(`/api/projects?workspaceId=${selectedWorkspace?.id}`),
        enabled: !!selectedWorkspace,
    });

    // 3. Mutation untuk menambahkan proyek baru
    const createProjectMutation = useMutation({
        mutationFn: (payload: any) => api.post<Project>("/api/projects", payload),
        onSuccess: () => {
            // Invalidate cache agar daftar project otomatis terupdate
            queryClient.invalidateQueries({ queryKey: ["projects", selectedWorkspace?.id] });
            setDialogOpen(false);
            setNewProject({ name: "", description: "", startDate: "", dueDate: "" });
        },
        onError: (err: any) => {
            alert(err.message || "Gagal membuat proyek");
        },
    });

    const handleSelectWorkspace = (ws: Workspace) => {
        setSelectedWorkspace(ws);
        localStorage.setItem("active_workspace_id", ws.id);
    };

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkspace) return;

        createProjectMutation.mutate({
            name: newProject.name,
            description: newProject.description || undefined,
            workspaceId: selectedWorkspace.id,
            startDate: newProject.startDate ? new Date(newProject.startDate).toISOString() : undefined,
            dueDate: newProject.dueDate ? new Date(newProject.dueDate).toISOString() : undefined,
        });
    };

    if (sessionPending || workspacesLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-400">Memuat workspace...</div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header / Workspace Switcher */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Proyek</h1>
                    {workspaces.length > 0 && selectedWorkspace && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                    <IconBuildingCommunity size={16} className="text-gray-500" />
                                    <span>{selectedWorkspace.name}</span>
                                    <IconChevronDown size={14} className="text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px]">
                                {workspaces.map((ws) => (
                                    <DropdownMenuItem
                                        key={ws.id}
                                        onClick={() => handleSelectWorkspace(ws)}
                                        className={ws.id === selectedWorkspace.id ? "bg-blue-light/50 text-velo-blue font-medium" : ""}
                                    >
                                        {ws.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {selectedWorkspace && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-velo-blue hover:bg-blue-deep text-white">
                                <IconPlus size={16} className="mr-1" />
                                Buat Proyek
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreateProject}>
                                <DialogHeader>
                                    <DialogTitle>Buat Proyek Baru</DialogTitle>
                                    <DialogDescription>
                                        Tambahkan proyek baru ke workspace {selectedWorkspace.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="proj-name">Nama Proyek</Label>
                                        <Input
                                            id="proj-name"
                                            placeholder="Redesign Website Velo"
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="proj-desc">Deskripsi (Opsional)</Label>
                                        <Input
                                            id="proj-desc"
                                            placeholder="Deskripsi singkat mengenai proyek ini"
                                            value={newProject.description}
                                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="proj-start">Tanggal Mulai</Label>
                                            <Input
                                                id="proj-start"
                                                type="date"
                                                value={newProject.startDate}
                                                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="proj-due">Tenggat Waktu (Due Date)</Label>
                                            <Input
                                                id="proj-due"
                                                type="date"
                                                value={newProject.dueDate}
                                                onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-velo-blue hover:bg-blue-deep"
                                        disabled={createProjectMutation.isPending}
                                    >
                                        {createProjectMutation.isPending ? "Membuat..." : "Buat Proyek"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* List Project */}
            {workspaces.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <IconBuildingCommunity size={48} className="text-gray-300 mb-3" />
                        <p className="font-medium text-sm">Belum Ada Workspace</p>
                        <p className="text-gray-400 text-xs mt-1">
                            Anda harus memiliki minimal satu workspace di Dashboard untuk membuat proyek.
                        </p>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="outline"
                            size="sm"
                            className="mt-4"
                        >
                            Ke Dashboard
                        </Button>
                    </CardContent>
                </Card>
            ) : projectsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((n) => (
                        <Card key={n} className="animate-pulse">
                            <CardContent className="h-32 bg-gray-50/50" />
                        </Card>
                    ))}
                </div>
            ) : projectsData.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <IconFolder size={48} className="text-gray-300 mb-3" />
                        <p className="font-medium text-sm">Belum Ada Proyek</p>
                        <p className="text-gray-400 text-xs mt-1">
                            Belum ada proyek di workspace ini. Klik tombol di kanan atas untuk membuat proyek pertama Anda!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectsData.map((project) => (
                        <Card
                            key={project.id}
                            className="hover:border-velo-blue/30 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                            onClick={() => router.push(`/projects/${project.id}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold truncate max-w-[80%]">
                                        {project.name}
                                    </CardTitle>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${project.status === "active" ? "bg-green-100 text-green-700" :
                                            project.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                                                project.status === "completed" ? "bg-blue-100 text-blue-700" :
                                                    "bg-gray-100 text-gray-700"
                                        }`}>
                                        {project.status === "active" ? "Aktif" :
                                            project.status === "paused" ? "Ditunda" :
                                                project.status === "completed" ? "Selesai" : "Diarsip"}
                                    </span>
                                </div>
                                <CardDescription className="line-clamp-2 text-xs h-8">
                                    {project.description || "Tidak ada deskripsi."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2 text-[11px] text-gray-400 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <IconCalendar size={14} />
                                    <span>
                                        Dibuat {formatDistanceToNow(new Date(project.createdAt), {
                                            addSuffix: true,
                                            locale: localeID,
                                        })}
                                    </span>
                                </div>
                                {project.dueDate && (
                                    <span className="font-medium text-gray-500">
                                        Tenggat: {new Date(project.dueDate).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}