"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task, TaskCard } from "./task-card";
import { KanbanColumn } from "./kanban-column";

interface KanbanBoardProps {
    projectId: string;
}

const COLUMNS = [
    { id: "backlog", title: "Backlog", colorClass: "bg-gray-400" },
    { id: "todo", title: "To Do", colorClass: "bg-blue-500" },
    { id: "in_progress", title: "In Progress", colorClass: "bg-yellow-500" },
    { id: "review", title: "Review", colorClass: "bg-purple-500" },
    { id: "done", title: "Done", colorClass: "bg-green-500" },
] as const;

export function KanbanBoard({ projectId }: KanbanBoardProps) {
    const queryClient = useQueryClient();
    const [tasksList, setTasksList] = useState<Task[]>([]);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // 1. Ambil seluruh data task untuk proyek ini
    const { data: initialTasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ["tasks", projectId],
        queryFn: () => api.get<Task[]>(`/api/tasks?projectId=${projectId}`),
    });

    // Sinkronkan data query ke local state tasksList
    useEffect(() => {
        if (initialTasks) {
            setTasksList(initialTasks);
        }
    }, [initialTasks]);

    // 2. Setup sensor DnD (jarak geser minimal 8px agar tidak bentrok dengan klik biasa)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 3. Mutation reorder dengan teknik OPTIMISTIC UPDATE
    const reorderMutation = useMutation({
        mutationFn: (payload: any) => api.patch("/api/tasks/reorder", payload),
        onMutate: async (newOrder) => {
            // Batalkan fetch yang sedang berjalan agar tidak menimpa state optimis kita
            await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

            // Ambil snapshot data lama sebagai backup
            const previousTasks = queryClient.getQueryData<Task[]>(["tasks", projectId]);

            // Optimistically update ke cache TanStack Query
            queryClient.setQueryData(["tasks", projectId], tasksList);

            return { previousTasks };
        },
        onError: (err, newOrder, context) => {
            // Kembalikan ke state semula jika API backend gagal merespons
            if (context?.previousTasks) {
                queryClient.setQueryData(["tasks", projectId], context.previousTasks);
                setTasksList(context.previousTasks);
            }
            alert("Gagal menyimpan posisi tugas.");
        },
        onSettled: () => {
            // Refetch di background untuk memastikan data di DB dan UI benar-benar sinkron
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        },
    });

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasksList.find((t) => t.id === active.id);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeTaskItem = tasksList.find((t) => t.id === activeId);
        const overTaskItem = tasksList.find((t) => t.id === overId);

        if (!activeTaskItem) return;

        // KASUS A: Geser kartu ke area kolom kosong
        const isOverAColumn = COLUMNS.some((col) => col.id === overId);
        if (isOverAColumn) {
            const overColumnId = overId as Task["status"];
            if (activeTaskItem.status !== overColumnId) {
                setTasksList((prev) => {
                    return prev.map((t) => {
                        if (t.id === activeId) {
                            return { ...t, status: overColumnId, position: 0 };
                        }
                        return t;
                    });
                });
            }
            return;
        }

        // KASUS B: Geser kartu menimpa kartu lain (bisa beda kolom atau kolom sama)
        if (overTaskItem && activeTaskItem.status !== overTaskItem.status) {
            setTasksList((prev) => {
                const activeIndex = prev.findIndex((t) => t.id === activeId);
                const overIndex = prev.findIndex((t) => t.id === overId);

                const updatedTasks = [...prev];
                updatedTasks[activeIndex] = {
                    ...activeTaskItem,
                    status: overTaskItem.status,
                };

                return arrayMove(updatedTasks, activeIndex, overIndex);
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeIndex = tasksList.findIndex((t) => t.id === activeId);
        const overIndex = tasksList.findIndex((t) => t.id === overId);

        let newTasks = [...tasksList];

        if (activeIndex !== overIndex && overIndex !== -1) {
            newTasks = arrayMove(tasksList, activeIndex, overIndex);
        }

        // Hitung ulang indeks posisi (0, 1, 2, dst) per status kolom
        const reorderedTasks: Record<string, Task[]> = {};
        COLUMNS.forEach((col) => {
            reorderedTasks[col.id] = newTasks
                .filter((t) => t.status === col.id)
                .map((t, idx) => ({ ...t, position: idx }));
        });

        // Satukan kembali array hasil hitung posisi
        const finalTasksList = Object.values(reorderedTasks).flat();
        setTasksList(finalTasksList);

        // Siapkan payload ringkas untuk dikirim ke API /reorder
        const payloadTasks = finalTasksList.map((t) => ({
            id: t.id,
            status: t.status,
            position: t.position,
        }));

        reorderMutation.mutate({
            projectId,
            tasks: payloadTasks,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-400 animate-pulse text-xs">
                Memuat Kanban Board...
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {COLUMNS.map((col) => {
                    const columnTasks = tasksList
                        .filter((t) => t.status === col.id)
                        .sort((a, b) => a.position - b.position);

                    return (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            tasks={columnTasks}
                            colorClass={col.colorClass}
                            projectId={projectId}
                        />
                    );
                })}
            </div>

            {/* DragOverlay menampilkan rendering kartu melayang yang realistis saat digeser */}
            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
}