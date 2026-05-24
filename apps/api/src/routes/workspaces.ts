import type { FastifyPluginAsync } from "fastify";
import { db, workspaces, workspaceMembers } from "@velo/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";
import { randomUUID } from "crypto";
import { z } from "zod";
import { validateBody } from "../lib/validate.js";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  slug: z.string()
    .min(2, "Slug minimal 2 karakter")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
});

const workspaceRoutes: FastifyPluginAsync = async (fastify) => {

    // Semua route di sini butuh login
    fastify.addHook("preHandler", requireAuth);

    // 1. GET /api/workspaces -> List semua workspace milik user
    fastify.get("/", async (request, reply) => {
        const userId = request.user.id;

        // Ambil workspace dimana user menjadi member
        const userWorkspaces = await db
            .select({
                id: workspaces.id,
                name: workspaces.name,
                slug: workspaces.slug,
                role: workspaceMembers.role,
            })
            .from(workspaceMembers)
            .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
            .where(eq(workspaceMembers.userId, userId));

        return reply.send(userWorkspaces);
    });

    // 2. POST /api/workspaces -> Buat workspace baru
    fastify.post("/", async (request, reply) => {
        const data = validateBody(request.body, createWorkspaceSchema, reply);
        if (!data) return; // Jika gagal, validateBody sudah mengirim response error otomatis

        const { name, slug } = data;
        const userId = request.user.id;

        try {
            // Drizzle Transaction: Buat workspace + Set owner di tabel members
            const newWorkspace = await db.transaction(async (tx) => {

                // Insert workspace
                const [workspace] = await tx
                    .insert(workspaces)
                    .values({
                        name,
                        slug,
                        ownerId: userId,
                    })
                    .returning();

                // Insert owner sebagai admin di workspace_members
                await tx.insert(workspaceMembers).values({
                    workspaceId: workspace.id,
                    userId: userId,
                    role: "owner",
                });

                return workspace;
            });

            return reply.status(201).send(newWorkspace);
        } catch (error: any) {
            // Catch slug duplicate error dari Postgres
            if (error.code === "23505") {
                return reply.status(409).send({ error: "Slug already exists" });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });

    // 3. GET /api/workspaces/:slug -> Detail workspace
    fastify.get("/:slug", async (request, reply) => {
        const { slug } = request.params as { slug: string };
        const userId = request.user.id;

        const [workspaceDetail] = await db
            .select()
            .from(workspaces)
            .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
            .where(and(
                eq(workspaces.slug, slug),
                eq(workspaceMembers.userId, userId)
            ));

        if (!workspaceDetail) {
            return reply.status(404).send({ error: "Workspace not found or access denied" });
        }

        return reply.send(workspaceDetail);
    });
};

export default workspaceRoutes;