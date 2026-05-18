import fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { config } from "dotenv";

config();

const server = fastify({ logger: true });

server.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
});

server.register(cookie);

server.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
})

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3001;
        await server.listen({ port, host: "0.0.0.0" });
        console.log(`Server running at http://localhost:${port}`)
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();