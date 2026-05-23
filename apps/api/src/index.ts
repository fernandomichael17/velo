import fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { config } from "dotenv";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";

// Load .env dari root project
config({ path: "../../.env" });

const server = fastify({ logger: true });

// CORS — izinkan frontend
server.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
});

server.register(cookie);

// ============================================
// Better Auth — catch-all route /api/auth/*
// ============================================
server.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
        try {
            const url = new URL(request.url, `http://${request.headers.host}`);
            const headers = fromNodeHeaders(request.headers);

            const req = new Request(url.toString(), {
                method: request.method,
                headers,
                ...(request.body ? { body: JSON.stringify(request.body) } : {}),
            });

            const response = await auth.handler(req);

            reply.status(response.status);
            response.headers.forEach((value, key) => reply.header(key, value));
            return reply.send(response.body ? await response.text() : null);
        } catch (error) {
            server.log.error(error as any, "Auth Error");
            return reply.status(500).send({
                error: "Internal authentication error",
                code: "AUTH_FAILURE",
            });
        }
    },
});

// ============================================
// Health check
// ============================================
server.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
});

// ============================================
// Protected route contoh — GET /api/me
// ============================================
server.get("/api/me", async (request, reply) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
        return reply.status(401).send({ error: "Unauthorized" });
    }

    return reply.send(session);
});

// ============================================
// Start server
// ============================================
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3001;
        await server.listen({ port, host: "0.0.0.0" });
        console.log(`🚀 Server running at http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();