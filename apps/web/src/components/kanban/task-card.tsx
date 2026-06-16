"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconFlame, IconClock } from "@tabler/icons-react";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: "backlog" | "todo" | "in_progress" | "review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    position: number;
    projectId: string;
    assigneeId: string | null;
    dueDate: string | null;
    assignee?: {
        id: string;
        name: string;
        image: string | null;
    } | null;
}

interface TaskCardProps {
    task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Efek transparan saat kartu sedang melayang
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "bg-red-100 text-red-700 border-red-200";
            case "high": return "bg-orange-100 text-orange-700 border-orange-200";
            case "medium": return "bg-blue-100 text-velo-blue border-blue-200";
            default: return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="hover:border-velo-blue/30 shadow-none hover:shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 bg-white">
                <CardContent className="p-3.5 space-y-3">
                    {/* Tags / Priority */}
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border capitalize ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.priority === "urgent" && (
                            <IconFlame size={14} className="text-red-500 animate-pulse" />
                        )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-ink line-clamp-2 leading-snug">
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                                {task.description}
                            </p>
                        )}
                    </div>

                    {/* Footer Info */}
                    {(task.dueDate || task.assignee) && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                            {task.dueDate ? (
                                <div className="flex items-center gap-1">
                                    <IconClock size={12} />
                                    <span>
                                        {new Date(task.dueDate).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short"
                                        })}
                                    </span>
                                </div>
                            ) : (
                                <div />
                            )}

                            {task.assignee && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-5 h-5 rounded-full bg-velo-blue text-white flex items-center justify-center font-bold text-[9px] cursor-help">
                                                {task.assignee.name.charAt(0).toUpperCase()}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-[10px]">{task.assignee.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}