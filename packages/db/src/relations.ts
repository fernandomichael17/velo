import { relations } from "drizzle-orm";
import {
    users,
    workspaces,
    workspaceMembers,
    projects,
    tasks,
} from "./schema";

// ============================================
// USER RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
    workspaceMembers: many(workspaceMembers),
    ownedWorkspaces: many(workspaces),
    ownedProjects: many(projects),
    assignedTasks: many(tasks),
}));

// ============================================
// WORKSPACE RELATIONS
// ============================================

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
    owner: one(users, {
        fields: [workspaces.ownerId],
        references: [users.id],
    }),
    members: many(workspaceMembers),
    projects: many(projects),
}));

// ============================================
// WORKSPACE MEMBER RELATIONS
// ============================================

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceMembers.workspaceId],
        references: [workspaces.id],
    }),
    user: one(users, {
        fields: [workspaceMembers.userId],
        references: [users.id],
    })
}));

// ============================================
// PROJECT RELATIONS
// ============================================

export const projectsRelations = relations(projects, ({ one, many }) => ({
    workspace: one(workspaces, {
        fields: [projects.workspaceId],
        references: [workspaces.id],
    }),
    owner: one(users, {
        fields: [projects.ownerId],
        references: [users.id],
    }),
    tasks: many(tasks),
}));

// ============================================
// TASK RELATIONS
// ============================================
export const tasksRelations = relations(tasks, ({ one }) => ({
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
    assignee: one(users, {
        fields: [tasks.assigneeId],
        references: [users.id],
    }),
}));