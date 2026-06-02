"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconArrowLeft, IconFolder, IconCalendar, IconSettings } from "@tabler/icons-react";

interface ProjectDetail {
    id: string;
    name: string;
    description: string | null;
    status: string;
    startDate: string | null;
    dueDate: string | null;
    taskCount: number;
}

export default function ProjectDetailPage() {
    const { projectId } = useParams() as { projectId: string };
    const router = useRouter();

    // Query detail proyek
    const { data: project, isLoading, error } = useQuery<ProjectDetail>({
        queryKey: ["project", projectId],
        queryFn: () => api.get<ProjectDetail>(`/api/projects/${projectId}`),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-400">Memuat detail proyek...</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="text-center py-12 space-y-4">
                <p className="text-red-500 font-medium">Gagal memuat detail proyek atau proyek tidak ditemukan.</p>
                <Button variant="outline" onClick={() => router.push("/projects")}>
                    Kembali ke Daftar Proyek
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/projects")}
                className="text-gray-500 hover:text-ink -ml-2"
            >
                <IconArrowLeft size={16} className="mr-1.5" />
                Kembali ke Proyek
            </Button>

            {/* Project Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-ink">{project.name}</h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-light text-velo-blue capitalize">
                            {project.status === "active" ? "Aktif" : project.status}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">{project.description || "Tidak ada deskripsi."}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-light rounded-lg text-velo-blue">
                            <IconFolder size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Tugas</p>
                            <p className="text-lg font-semibold">{project.taskCount} Tugas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <IconCalendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tanggal Mulai</p>
                            <p className="text-sm font-semibold mt-0.5">
                                {project.startDate ? new Date(project.startDate).toLocaleDateString("id-ID") : "-"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <IconCalendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tenggat Waktu</p>
                            <p className="text-sm font-semibold mt-0.5">
                                {project.dueDate ? new Date(project.dueDate).toLocaleDateString("id-ID") : "-"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board Placeholder */}
            <Card className="border-dashed bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <IconSettings size={48} className="text-gray-300 animate-spin-slow mb-4" />
                    <h3 className="font-semibold text-lg">Kanban Board Sedang Disiapkan</h3>
                    <p className="text-gray-400 text-xs max-w-sm mt-1 mx-auto">
                        Halaman proyek telah berhasil dihubungkan dengan API. Di Step 2.5, kita akan mengisi area ini dengan Kanban Board drag-and-drop.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}