import fp from "fastify-plugin";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import type { FastifyRequest, FastifyReply } from "fastify";

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
        return reply.status(401).send({ error: "Unauthorized" });
    }

    // Simpan session dan user di context request
    request.user = session.user;
    request.session = session.session;
};

export default fp(async (fastify) => {
    fastify.decorate("requireAuth", requireAuth);
});