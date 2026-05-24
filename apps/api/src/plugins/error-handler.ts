import fp from "fastify-plugin";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export default fp(async (fastify) => {
    fastify.setErrorHandler(
        (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
            // Log error ke server
            fastify.log.error({
                err: error,
                url: request.url,
                method: request.method,
            });

            // Format response konsisten
            const statusCode = error.statusCode || 500;
            const response: Record<string, unknown> = {
                error: statusCode >= 500 ? "Internal Server Error" : error.message,
                code: error.code || "UNKNOWN_ERROR",
            };

            // Jangan bocorkan stack trace ke client di production
            if (process.env.NODE_ENV === "development") {
                response.stack = error.stack;
            }

            return reply.status(statusCode).send(response);
        }
    );
});