import type { FastifyPluginAsync } from "fastify";
import { db, tasks, projects, workspaceMembers, users } from "@velo/db";
import { eq, and, asc, sql } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";
import { z } from "zod";
import { validateBody } from "../lib/validate.js";

// Schema validasi pembuatan task baru
const createTaskSchema = z.object({
    title: z.string().min(1, "Judul tugas minimal 1 karakter").max(500),
    description: z.string().optional(),
    status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    projectId: z.string(),
    assigneeId: z.string().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
});

// Schema validasi pembaruan task
const updateTaskSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    position: z.number().int().min(0).optional(),
    assigneeId: z.string().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
});

// Schema validasi untuk reorder (drag-and-drop Kanban)
const reorderTasksSchema = z.object({
    projectId: z.string(),
    tasks: z.array(
        z.object({
            id: z.string(),
            status: z.enum(["backlog", "todo", "in_progress", "review", "done"]),
            position: z.number().int().min(0),
        })
    ),
});

const taskRoutes: FastifyPluginAsync = async (fastify) => {

    // Semua route membutuhkan autentikasi
    fastify.addHook("preHandler", requireAuth);

    // ============================================
    // 1. GET /api/tasks?projectId=xxx
    // Mengambil semua task di proyek tertentu (urut posisi)
    // ============================================
    fastify.get("/", async (request, reply) => {
        const { projectId } = request.query as { projectId?: string };
        const userId = request.user.id;

        if (!projectId) {
            return reply.status(400).send({ error: "projectId is required" });
        }

        // Cari proyek untuk validasi workspace membership
        const [project] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, projectId));

        if (!project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        // Validasi keanggotaan workspace
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, project.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Ambil task dengan left join untuk info assignee
        const projectTasks = await db
            .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                status: tasks.status,
                priority: tasks.priority,
                position: tasks.position,
                projectId: tasks.projectId,
                assigneeId: tasks.assigneeId,
                dueDate: tasks.dueDate,
                createdAt: tasks.createdAt,
                updatedAt: tasks.updatedAt,
                assignee: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    image: users.image,
                }
            })
            .from(tasks)
            .leftJoin(users, eq(tasks.assigneeId, users.id))
            .where(eq(tasks.projectId, projectId))
            .orderBy(asc(tasks.position));

        return reply.send(projectTasks);
    });

    // ============================================
    // 2. POST /api/tasks
    // Membuat task baru (otomatis di posisi terakhir kolom)
    // ============================================
    fastify.post("/", async (request, reply) => {
        const data = validateBody(request.body, createTaskSchema, reply);
        if (!data) return;

        const userId = request.user.id;

        // Cek project & workspace membership
        const [project] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, data.projectId));

        if (!project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, project.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Cari posisi maksimum di kolom status tersebut agar task baru ditaruh paling bawah
        const [maxPosResult] = await db
            .select({ maxPos: sql<number>`coalesce(max(${tasks.position}), -1)` })
            .from(tasks)
            .where(
                and(
                    eq(tasks.projectId, data.projectId),
                    eq(tasks.status, data.status || "backlog")
                )
            );
        const position = maxPosResult.maxPos + 1;

        // Buat task
        const [newTask] = await db
            .insert(tasks)
            .values({
                title: data.title,
                description: data.description,
                status: data.status || "backlog",
                priority: data.priority || "medium",
                position,
                projectId: data.projectId,
                assigneeId: data.assigneeId || null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            })
            .returning();

        return reply.status(201).send(newTask);
    });

    // ============================================
    // 3. GET /api/tasks/:id
    // Detail dari task tertentu
    // ============================================
    fastify.get("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user.id;

        // Ambil task detail beserta assignee
        const [taskDetail] = await db
            .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                status: tasks.status,
                priority: tasks.priority,
                position: tasks.position,
                projectId: tasks.projectId,
                assigneeId: tasks.assigneeId,
                dueDate: tasks.dueDate,
                createdAt: tasks.createdAt,
                updatedAt: tasks.updatedAt,
                assignee: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    image: users.image,
                }
            })
            .from(tasks)
            .leftJoin(users, eq(tasks.assigneeId, users.id))
            .where(eq(tasks.id, id));

        if (!taskDetail) {
            return reply.status(404).send({ error: "Task not found" });
        }

        // Cari workspaceId untuk otorisasi
        const [project] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, taskDetail.projectId));

        // Cek membership
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, project.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        return reply.send(taskDetail);
    });

    // ============================================
    // 4. PATCH /api/tasks/:id
    // Update data task
    // ============================================
    fastify.patch("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = validateBody(request.body, updateTaskSchema, reply);
        if (!data) return;

        const userId = request.user.id;

        const [existingTask] = await db
            .select({ projectId: tasks.projectId })
            .from(tasks)
            .where(eq(tasks.id, id));

        if (!existingTask) {
            return reply.status(404).send({ error: "Task not found" });
        }

        // Cari project & workspaceId untuk otorisasi
        const [project] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, existingTask.projectId));

        // Cek keanggotaan
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, project.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Siapkan field update secara partial
        const updateFields: Record<string, any> = {};
        if (data.title !== undefined) updateFields.title = data.title;
        if (data.description !== undefined) updateFields.description = data.description;
        if (data.status !== undefined) updateFields.status = data.status;
        if (data.priority !== undefined) updateFields.priority = data.priority;
        if (data.position !== undefined) updateFields.position = data.position;
        if (data.assigneeId !== undefined) updateFields.assigneeId = data.assigneeId;
        if (data.dueDate !== undefined) updateFields.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        updateFields.updatedAt = new Date();

        const [updatedTask] = await db
            .update(tasks)
            .set(updateFields)
            .where(eq(tasks.id, id))
            .returning();

        return reply.send(updatedTask);
    });

    // ============================================
    // 5. DELETE /api/tasks/:id
    // Menghapus task
    // ============================================
    fastify.delete("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user.id;

        const [existingTask] = await db
            .select({ projectId: tasks.projectId })
            .from(tasks)
            .where(eq(tasks.id, id));

        if (!existingTask) {
            return reply.status(404).send({ error: "Task not found" });
        }

        // Otorisasi
        const [project] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, existingTask.projectId));

        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, project.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        await db.delete(tasks).where(eq(tasks.id, id));

        return reply.status(204).send();
    });

    // ============================================
    // 6. PATCH /api/tasks/reorder
    // Update bulk posisi task (Digunakan saat Drag-and-Drop)
    // ============================================
    fastify.patch("/reorder", async (request, reply) => {
        const data = validateBody(request.body, reorderTasksSchema, reply);
        if (!data) return;

        const userId = request.user.id;

        // Cek project & workspace membership
        const [project] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, data.projectId));

        if (!project) {
            return reply.status(404).send({ error: "Project not found" });
        }

        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, project.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Gunakan Drizzle database transaction untuk atomisitas (semua berhasil atau gagal bersamaan)
        await db.transaction(async (tx) => {
            for (const t of data.tasks) {
                await tx
                    .update(tasks)
                    .set({
                        status: t.status,
                        position: t.position,
                        updatedAt: new Date(),
                    })
                    .where(eq(tasks.id, t.id));
            }
        });

        return reply.send({ success: true, message: "Tasks reordered successfully" });
    });
};

export default taskRoutes;