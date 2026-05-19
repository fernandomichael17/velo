import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";

// ============================================
// ENUMS
// ============================================

// Role enum untuk workspace member
export const workspaceRoleEnum = pgEnum("workspace_role", [
    "owner",
    "admin",
    "member",
    "viewer",
]);

// ============================================
// USERS
// ============================================

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// WORKSPACES (Tenant)
// ============================================

export const workspaces = pgTable("workspaces", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// WORKSPACE MEMBERS
// ============================================

export const workspaceMembers = pgTable("workspace_members", {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
        .notNull()
        .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ============================================
// SESSIONS (untuk better-auth)
// ============================================

export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// ACCOUNTS (untuk OAuth — better-auth)
// ============================================

export const accounts = pgTable("accounts", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// VERIFICATIONS (email verify, reset password)
// ============================================

export const verifications = pgTable("verifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
