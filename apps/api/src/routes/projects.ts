import type { FastifyPluginAsync } from "fastify";
import { db, projects, workspaceMembers, tasks } from "@velo/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";
import { z } from "zod";
import { validateBody } from "../lib/validate.js";

// Schema validasi untuk pembuatan project baru
const createProjectSchema = z.object({
    name: z.string().min(1, "Nama proyek minimal 1 karakter").max(255),
    description: z.string().optional(),
    workspaceId: z.string(), // ID workspace dalam format string (UUID)
    startDate: z.string().datetime().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
});

// Schema validasi untuk pembaruan project
const updateProjectSchema = z.object({
    name: z.string().min(1, "Nama proyek minimal 1 karakter").max(255).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(["active", "paused", "completed", "archived"]).optional(),
    startDate: z.string().datetime().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
});

const projectRoutes: FastifyPluginAsync = async (fastify) => {

    // Semua route proyek membutuhkan autentikasi
    fastify.addHook("preHandler", requireAuth);

    // ============================================
    // 1. GET /api/projects?workspaceId=xxx
    // List semua project di suatu workspace
    // ============================================
    fastify.get("/", async (request, reply) => {
        const { workspaceId } = request.query as { workspaceId?: string };
        const userId = request.user.id;

        if (!workspaceId) {
            return reply.status(400).send({ error: "workspaceId is required" });
        }

        // Validasi keanggotaan workspace: Cek apakah user terdaftar di workspace tersebut
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied or workspace not found" });
        }

        // Ambil semua project dalam workspace tersebut
        const workspaceProjects = await db
            .select()
            .from(projects)
            .where(eq(projects.workspaceId, workspaceId));

        return reply.send(workspaceProjects);
    });

    // ============================================
    // 2. POST /api/projects
    // Membuat project baru
    // ============================================
    fastify.post("/", async (request, reply) => {
        const data = validateBody(request.body, createProjectSchema, reply);
        if (!data) return; // validateBody mengirim response error otomatis jika gagal

        const userId = request.user.id;

        // Validasi keanggotaan workspace
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, data.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied or workspace not found" });
        }

        // Lakukan insert proyek baru
        const [newProject] = await db
            .insert(projects)
            .values({
                name: data.name,
                description: data.description,
                workspaceId: data.workspaceId,
                ownerId: userId,
                startDate: data.startDate ? new Date(data.startDate) : null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            })
            .returning();

        return reply.status(201).send(newProject);
    });

    // ============================================
    // 3. GET /api/projects/:id
    // Detail project tertentu + total task count
    // ============================================
    fastify.get("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user.id;

        // Ambil detail proyek beserta jumlah task yang terkait (LEFT JOIN + COUNT)
        const [projectDetail] = await db
            .select({
                id: projects.id,
                name: projects.name,
                description: projects.description,
                status: projects.status,
                workspaceId: projects.workspaceId,
                ownerId: projects.ownerId,
                startDate: projects.startDate,
                dueDate: projects.dueDate,
                createdAt: projects.createdAt,
                updatedAt: projects.updatedAt,
                taskCount: sql<number>`count(${tasks.id})::int`,
            })
            .from(projects)
            .leftJoin(tasks, eq(projects.id, tasks.projectId))
            .where(eq(projects.id, id))
            .groupBy(projects.id);

        if (!projectDetail) {
            return reply.status(404).send({ error: "Project not found" });
        }

        // Validasi keanggotaan workspace
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, projectDetail.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        return reply.send(projectDetail);
    });

    // ============================================
    // 4. PATCH /api/projects/:id
    // Mengubah detail project
    // ============================================
    fastify.patch("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = validateBody(request.body, updateProjectSchema, reply);
        if (!data) return;

        const userId = request.user.id;

        // Cari workspaceId proyek tersebut untuk validasi keanggotaan
        const [existingProject] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, id));

        if (!existingProject) {
            return reply.status(404).send({ error: "Project not found" });
        }

        // Validasi keanggotaan
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, existingProject.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Susun payload update secara dinamis (partial update)
        const updateFields: Record<string, any> = {};
        if (data.name !== undefined) updateFields.name = data.name;
        if (data.description !== undefined) updateFields.description = data.description;
        if (data.status !== undefined) updateFields.status = data.status;
        if (data.startDate !== undefined) updateFields.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.dueDate !== undefined) updateFields.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        updateFields.updatedAt = new Date();

        const [updatedProject] = await db
            .update(projects)
            .set(updateFields)
            .where(eq(projects.id, id))
            .returning();

        return reply.send(updatedProject);
    });

    // ============================================
    // 5. DELETE /api/projects/:id
    // Menghapus project
    // ============================================
    fastify.delete("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user.id;

        // Cari workspaceId untuk otorisasi
        const [existingProject] = await db
            .select({ workspaceId: projects.workspaceId })
            .from(projects)
            .where(eq(projects.id, id));

        if (!existingProject) {
            return reply.status(404).send({ error: "Project not found" });
        }

        // Validasi keanggotaan
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, existingProject.workspaceId),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Hapus proyek (tabel tasks terhapus otomatis karena cascade onDelete)
        await db.delete(projects).where(eq(projects.id, id));

        return reply.status(204).send(); // Sukses tanpa konten respons
    });
};

export default projectRoutes;