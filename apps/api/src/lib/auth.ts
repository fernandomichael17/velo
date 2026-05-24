import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, users, sessions, accounts, verifications } from "@velo/db";

export const auth = betterAuth({
    // Secret untuk enkripsi
    secret: process.env.BETTER_AUTH_SECRET,

    // Base URL API server
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",

    // Database via Drizzle adapter
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: users,
            session: sessions,
            account: accounts,
            verification: verifications,
        }
    }),

    // Aktifkan email + password
    emailAndPassword: {
        enabled: true,
    },

    // Trusted origins (frontend URL)
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:3000"
    ],

    // Cookie prefix — HARUS sama dengan auth-client di frontend
    advanced: {
        cookiePrefix: "velo",
    },
})