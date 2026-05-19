import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env dari root project (2 level atas)
dotenv.config({ path: "../../.env" });

export default defineConfig({
    schema: "./src/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://velo_user:velo_password@localhost:5433/velo_db",
    },
});
