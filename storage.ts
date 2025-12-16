import {
  users,
  files,
  shares,
  activities,
  type User,
  type UpsertUser,
  type File,
  type InsertFile,
  type Share,
  type InsertShare,
  type Activity,
  type InsertActivity,
  STORAGE_PLANS,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStorage(userId: string, bytesChange: number): Promise<void>;
  updateUserPlan(userId: string, plan: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User>;

  // File operations
  getFile(id: string): Promise<File | undefined>;
  getFiles(userId: string, parentId: string | null): Promise<File[]>;
  getStarredFiles(userId: string): Promise<File[]>;
  getRecentFiles(userId: string, limit?: number): Promise<File[]>;
  getTrashedFiles(userId: string): Promise<File[]>;
  getSharedFiles(userId: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, updates: Partial<InsertFile>): Promise<File>;
  moveToTrash(id: string): Promise<File>;
  restoreFromTrash(id: string): Promise<File>;
  deleteFilePermanently(id: string): Promise<void>;
  emptyTrash(userId: string): Promise<void>;
  getFileBreadcrumb(fileId: string): Promise<{ id: string; name: string }[]>;

  // Share operations
  getShare(id: string): Promise<Share | undefined>;
  getShareByFileId(fileId: string): Promise<Share | undefined>;
  createShare(share: InsertShare): Promise<Share>;
  deleteShare(id: string): Promise<void>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(userId: string, limit?: number): Promise<Activity[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStorage(userId: string, bytesChange: number): Promise<void> {
    await db
      .update(users)
      .set({
        storageUsed: sql`${users.storageUsed} + ${bytesChange}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserPlan(userId: string, plan: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User> {
    const planConfig = STORAGE_PLANS[plan as keyof typeof STORAGE_PLANS];
    const [user] = await db
      .update(users)
      .set({
        plan,
        storageLimit: planConfig?.storage || STORAGE_PLANS.free.storage,
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // File operations
  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFiles(userId: string, parentId: string | null): Promise<File[]> {
    const conditions = [
      eq(files.userId, userId),
      eq(files.isTrashed, false),
    ];
    
    if (parentId === null) {
      conditions.push(isNull(files.parentId));
    } else {
      conditions.push(eq(files.parentId, parentId));
    }

    return db
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.isFolder), files.name);
  }

  async getStarredFiles(userId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isStarred, true),
          eq(files.isTrashed, false)
        )
      )
      .orderBy(files.name);
  }

  async getRecentFiles(userId: string, limit: number = 50): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isTrashed, false),
          eq(files.isFolder, false)
        )
      )
      .orderBy(desc(files.updatedAt))
      .limit(limit);
  }

  async getTrashedFiles(userId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isTrashed, true)
        )
      )
      .orderBy(desc(files.trashedAt));
  }

  async getSharedFiles(userId: string): Promise<File[]> {
    const result = await db
      .select({ file: files })
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(eq(shares.sharedWithId, userId));
    
    return result.map(r => r.file);
  }

  async createFile(file: InsertFile): Promise<File> {
    const [created] = await db.insert(files).values(file).returning();
    return created;
  }

  async updateFile(id: string, updates: Partial<InsertFile>): Promise<File> {
    const [updated] = await db
      .update(files)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return updated;
  }

  async moveToTrash(id: string): Promise<File> {
    const [updated] = await db
      .update(files)
      .set({
        isTrashed: true,
        trashedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(files.id, id))
      .returning();
    return updated;
  }

  async restoreFromTrash(id: string): Promise<File> {
    const [updated] = await db
      .update(files)
      .set({
        isTrashed: false,
        trashedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(files.id, id))
      .returning();
    return updated;
  }

  async deleteFilePermanently(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async emptyTrash(userId: string): Promise<void> {
    await db
      .delete(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.isTrashed, true)
        )
      );
  }

  async getFileBreadcrumb(fileId: string): Promise<{ id: string; name: string }[]> {
    const breadcrumb: { id: string; name: string }[] = [];
    let currentId: string | null = fileId;

    while (currentId) {
      const [file] = await db
        .select({ id: files.id, name: files.name, parentId: files.parentId })
        .from(files)
        .where(eq(files.id, currentId));

      if (!file) break;
      breadcrumb.unshift({ id: file.id, name: file.name });
      currentId = file.parentId;
    }

    return breadcrumb;
  }

  // Share operations
  async getShare(id: string): Promise<Share | undefined> {
    const [share] = await db.select().from(shares).where(eq(shares.id, id));
    return share;
  }

  async getShareByFileId(fileId: string): Promise<Share | undefined> {
    const [share] = await db.select().from(shares).where(eq(shares.fileId, fileId));
    return share;
  }

  async createShare(share: InsertShare): Promise<Share> {
    const [created] = await db.insert(shares).values(share).returning();
    return created;
  }

  async deleteShare(id: string): Promise<void> {
    await db.delete(shares).where(eq(shares.id, id));
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async getRecentActivities(userId: string, limit: number = 20): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
