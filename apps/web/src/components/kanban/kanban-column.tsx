"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { CreateTaskDialog } from "./create-task-dialog";

interface KanbanColumnProps {
    id: "backlog" | "todo" | "in_progress" | "review" | "done";
    title: string;
    tasks: Task[];
    colorClass: string;
    projectId: string;
}

export function KanbanColumn({ id, title, tasks, colorClass, projectId }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="flex flex-col w-64 bg-gray-50/50 rounded-xl border border-gray-200/60 p-3 h-[calc(100vh-220px)] min-h-[450px]">
            {/* Header Kolom */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                    <h3 className="font-semibold text-xs text-ink tracking-wide uppercase">
                        {title}
                    </h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-white border px-1.5 py-0.5 rounded-md shadow-sm">
                    {tasks.length}
                </span>
            </div>

            {/* Container Tugas (Droppable & Sortable) */}
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar pb-6"
            >
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-20 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-[10px] text-gray-400">
                        Belum ada tugas
                    </div>
                )}
            </div>

            {/* Tombol Add Task di bawah kolom */}
            <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500 hover:text-ink hover:bg-gray-100 mt-2 h-8 rounded-lg"
                onClick={() => setDialogOpen(true)}
            >
                <IconPlus size={14} className="mr-1" />
                Tambah Tugas
            </Button>

            <CreateTaskDialog
                projectId={projectId}
                defaultStatus={id}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    );
}