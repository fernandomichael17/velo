import { z } from "zod";
import type { FastifyReply } from "fastify";

/**
 * Validasi request body menggunakan Zod schema.
 * Return data yang sudah di-parse, atau null jika gagal (reply sudah dikirim).
 */

export function validateBody<T extends z.ZodType>(
    body: unknown,
    schema: T,
    reply: FastifyReply
): z.infer<T> | null {
    const result = schema.safeParse(body);
    if (!result.success) {
        reply.status(400).send({
            error: "Validation Error",
            details: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return null;
    }
    return result.data;
}