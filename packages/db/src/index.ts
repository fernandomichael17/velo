import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import * as relations from "./relations"

const connectionString =
    process.env.DATABASE_URL || "postgresql://velo_user:velo_password@localhost:5433/velo_db"

const client = postgres(connectionString)
export const db = drizzle(client, { schema: { ...schema, ...relations } })
export * from "./schema"
export * from "./relations"
