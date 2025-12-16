import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, bigint, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with storage quota and Stripe integration
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: varchar("plan").default("free").notNull(), // free, pro, business, enterprise
  storageUsed: bigint("storage_used", { mode: "number" }).default(0).notNull(),
  storageLimit: bigint("storage_limit", { mode: "number" }).default(5368709120).notNull(), // 5GB default
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Files table - stores both files and folders
export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // mime type or 'folder'
  size: bigint("size", { mode: "number" }).default(0).notNull(),
  url: varchar("url"), // Storage URL for actual files
  thumbnailUrl: varchar("thumbnail_url"),
  parentId: varchar("parent_id"), // null = root folder
  userId: varchar("user_id").notNull(),
  isFolder: boolean("is_folder").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  isTrashed: boolean("is_trashed").default(false).notNull(),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_files_user_id").on(table.userId),
  index("idx_files_parent_id").on(table.parentId),
  index("idx_files_is_trashed").on(table.isTrashed),
]);

// Shares table - for sharing files/folders
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull(),
  ownerId: varchar("owner_id").notNull(),
  sharedWithId: varchar("shared_with_id"), // null = link share
  shareType: varchar("share_type").default("link").notNull(), // link, user
  permission: varchar("permission").default("view").notNull(), // view, comment, edit
  password: varchar("password"),
  expiresAt: timestamp("expires_at"),
  downloadCount: bigint("download_count", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_shares_file_id").on(table.fileId),
  index("idx_shares_owner_id").on(table.ownerId),
]);

// Activity log table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileId: varchar("file_id"),
  action: varchar("action").notNull(), // upload, download, share, delete, rename, move, star
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activities_user_id").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
  shares: many(shares),
  activities: many(activities),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  parent: one(files, { fields: [files.parentId], references: [files.id] }),
  children: many(files),
  shares: many(shares),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  file: one(files, { fields: [shares.fileId], references: [files.id] }),
  owner: one(users, { fields: [shares.ownerId], references: [users.id] }),
  sharedWith: one(users, { fields: [shares.sharedWithId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  file: one(files, { fields: [activities.fileId], references: [files.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertFileSchema = createInsertSchema(files).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertShareSchema = createInsertSchema(shares).omit({ 
  id: true, 
  createdAt: true 
});

export const insertActivitySchema = createInsertSchema(activities).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Storage Plans
export const STORAGE_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    storage: 5 * 1024 * 1024 * 1024, // 5GB
    storageDisplay: '5 GB',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    features: ['5 GB Storage', 'Basic Sharing', 'File Preview', '30-day Trash'],
    color: 'gray'
  },
  pro: {
    name: 'Pro',
    price: 29900, // IDR 29,900/month
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    storageDisplay: '100 GB',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    features: ['100 GB Storage', 'Advanced Sharing', 'Priority Support', 'Password Protected Links'],
    color: 'violet'
  },
  business: {
    name: 'Business',
    price: 99900, // IDR 99,900/month
    storage: 1024 * 1024 * 1024 * 1024, // 1TB
    storageDisplay: '1 TB',
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    features: ['1 TB Storage', 'Team Collaboration', 'Custom Branding', 'Version History'],
    color: 'emerald'
  },
  enterprise: {
    name: 'Enterprise',
    price: 0, // Custom pricing
    storage: -1, // Unlimited
    storageDisplay: 'Unlimited',
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    features: ['Unlimited Storage', 'Dedicated Support', 'SLA 99.9%', 'Custom Integrations'],
    color: 'blue'
  }
} as const;

export type PlanType = keyof typeof STORAGE_PLANS;
