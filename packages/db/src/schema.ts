import {
    pgTable,
    varchar,
    text,
    timestamp,
    boolean,
    integer,
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
    id: text("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// WORKSPACES (Tenant)
// ============================================

export const workspaces = pgTable("workspaces", {
    id: text("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    ownerId: text("owner_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// WORKSPACE MEMBERS
// ============================================

export const workspaceMembers = pgTable("workspace_members", {
    id: text("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
    workspaceId: text("workspace_id")
        .notNull()
        .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// SESSIONS (untuk better-auth)
// ============================================

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// ACCOUNTS (untuk OAuth — better-auth)
// ============================================

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    userId: text("user_id")
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
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// VERIFICATIONS (email verify, reset password)
// ============================================

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// ENUMS — Phase 2
// ============================================

export const projectStatusEnum = pgEnum("project_status", [
    "active",
    "paused",
    "completed",
    "archived"
]);

export const taskStatusEnum = pgEnum("task_status", [
    "backlog",
    "todo",
    "in_progress",
    "review",
    "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
    "low",
    "medium",
    "high",
    "urgent",
]);

// ============================================
// PROJECTS
// ============================================
export const projects = pgTable("projects", {
    id: text("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("active"),
    workspaceId: text("workspace_id")
        .notNull()
        .references(() => workspaces.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
        .notNull()
        .references(() => users.id),
    startDate: timestamp("start_date"),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// ============================================
// TASKS
// ============================================
export const tasks = pgTable("tasks", {
    id: text("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("backlog"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    position: integer("position").notNull().default(0),
    projectId: text("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id")
        .references(() => users.id),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});