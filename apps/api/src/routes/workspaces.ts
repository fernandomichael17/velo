import type { FastifyPluginAsync } from "fastify";
import { db, workspaces, workspaceMembers, users } from "@velo/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../plugins/auth.js";
import { randomUUID } from "crypto";
import { z } from "zod";
import { validateBody } from "../lib/validate.js";
import { request } from "http";

const createWorkspaceSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(100),
    slug: z.string()
        .min(2, "Slug minimal 2 karakter")
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
});

const inviteMemberSchema = z.object({
    email: z.string().email("Format email tidak valid"),
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

    // 4. GET /api/workspaces/:id/members
    fastify.get("/:id/members", async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = request.user.id;

        // Validasi keanggotaan: Memastikan user yang login terdaftar di workspace tersebut
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, id),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership) {
            return reply.status(403).send({ error: "Access denied" });
        }

        // Ambil daftar anggota beserta profil mereka (JOIN dengan tabel users)
        const membersList = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
                role: workspaceMembers.role,
                joinedAt: workspaceMembers.joinedAt,
            })
            .from(workspaceMembers)
            .innerJoin(users, eq(workspaceMembers.userId, users.id))
            .where(eq(workspaceMembers.workspaceId, id));

        return reply.send(membersList);
    });

    // 5. POST /api/workspaces/:id/members
    // Menambahkan anggota baru ke workspace (Hanya Owner/Admin)
    fastify.post("/:id/members", async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = validateBody(request.body, inviteMemberSchema, reply);
        if (!data) return;

        const userId = request.user.id;

        // Validasi hak akses: Hanya Owner/Admin dari workspace ini yang boleh mengundang
        const [membership] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, id),
                    eq(workspaceMembers.userId, userId)
                )
            );

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            return reply.status(403).send({ error: "Only workspace owners or admins can invite members" });
        }

        // Cari user yang akan diundang di database berdasarkan email
        const [userToInvite] = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email));

        if (!userToInvite) {
            return reply.status(404).send({ error: "User dengan email tersebut tidak ditemukan." });
        }

        // Cek jika user tersebut sudah terdaftar sebagai anggota workspace
        const [existingMember] = await db
            .select()
            .from(workspaceMembers)
            .where(
                and(
                    eq(workspaceMembers.workspaceId, id),
                    eq(workspaceMembers.userId, userToInvite.id)
                )
            );

        if (existingMember) {
            return reply.status(400).send({ error: "User tersebut sudah terdaftar di workspace ini." });
        }

        // Insert anggota baru
        const [newMember] = await db
            .insert(workspaceMembers)
            .values({
                workspaceId: id,
                userId: userToInvite.id,
                role: "member", // Role default untuk anggota baru
            })
            .returning();

        return reply.status(201).send(newMember);
    });
};

export default workspaceRoutes;