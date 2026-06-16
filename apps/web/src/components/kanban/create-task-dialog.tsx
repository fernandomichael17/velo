"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IconPlus } from "@tabler/icons-react";

interface CreateTaskDialogProps {
    projectId: string;
    defaultStatus: "backlog" | "todo" | "in_progress" | "review" | "done";
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({
    projectId,
    defaultStatus,
    open,
    onOpenChange,
}: CreateTaskDialogProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState(defaultStatus);
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

    // Mengambil status default jika dialog dibuka ulang
    useState(() => {
        setStatus(defaultStatus);
    });

    const createTaskMutation = useMutation({
        mutationFn: (payload: any) => api.post("/api/tasks", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
            setTitle("");
            setDescription("");
            setPriority("medium");
            onOpenChange(false);
        },
        onError: (err: any) => {
            alert(err.message || "Gagal membuat tugas");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createTaskMutation.mutate({
            title,
            description: description || undefined,
            status,
            priority,
            projectId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Tambah Tugas Baru</DialogTitle>
                        <DialogDescription>
                            Buat tugas baru untuk kolom {status.replace("_", " ")}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Judul Tugas</Label>
                            <Input
                                id="task-title"
                                placeholder="Analisis kebutuhan database"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-desc">Deskripsi (Opsional)</Label>
                            <Input
                                id="task-desc"
                                placeholder="Rincian deskripsi mengenai tugas"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-status">Status (Kolom)</Label>
                                <Select
                                    value={status}
                                    onValueChange={(val: any) => setStatus(val)}
                                >
                                    <SelectTrigger id="task-status">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="backlog">Backlog</SelectItem>
                                        <SelectItem value="todo">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="review">Review</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="task-priority">Prioritas</Label>
                                <Select
                                    value={priority}
                                    onValueChange={(val: any) => setPriority(val)}
                                >
                                    <SelectTrigger id="task-priority">
                                        <SelectValue placeholder="Pilih prioritas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Rendah (Low)</SelectItem>
                                        <SelectItem value="medium">Sedang (Medium)</SelectItem>
                                        <SelectItem value="high">Tinggi (High)</SelectItem>
                                        <SelectItem value="urgent">Mendesak (Urgent)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-velo-blue hover:bg-blue-deep text-white"
                            disabled={createTaskMutation.isPending}
                        >
                            {createTaskMutation.isPending ? "Menyimpan..." : "Tambah Tugas"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}