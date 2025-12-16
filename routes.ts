import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { STORAGE_PLANS } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes - this endpoint does NOT use isAuthenticated so frontend can check auth status
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // File listing routes
  app.get("/api/files", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = req.query.folderId as string | undefined;
      
      const files = await storage.getFiles(userId, folderId || null);
      const breadcrumb = folderId 
        ? await storage.getFileBreadcrumb(folderId)
        : [];
      
      res.json({ files, breadcrumb });
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/starred", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getStarredFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching starred files:", error);
      res.status(500).json({ message: "Failed to fetch starred files" });
    }
  });

  app.get("/api/files/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getRecentFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching recent files:", error);
      res.status(500).json({ message: "Failed to fetch recent files" });
    }
  });

  app.get("/api/files/trash", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getTrashedFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching trashed files:", error);
      res.status(500).json({ message: "Failed to fetch trashed files" });
    }
  });

  app.get("/api/files/shared", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getSharedFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching shared files:", error);
      res.status(500).json({ message: "Failed to fetch shared files" });
    }
  });

  // File upload
  app.post("/api/files/upload", isAuthenticated, upload.array("files", 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parentId = req.body.parentId || null;
      const uploadedFiles = req.files as Express.Multer.File[];

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Check storage quota
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
      const plan = STORAGE_PLANS[user.plan as keyof typeof STORAGE_PLANS] || STORAGE_PLANS.free;
      
      if (user.storageLimit > 0 && user.storageUsed + totalSize > user.storageLimit) {
        // Clean up uploaded files
        uploadedFiles.forEach(f => fs.unlinkSync(f.path));
        return res.status(400).json({ message: "Storage quota exceeded" });
      }

      // Check max file size per plan
      for (const file of uploadedFiles) {
        if (file.size > plan.maxFileSize) {
          uploadedFiles.forEach(f => fs.unlinkSync(f.path));
          return res.status(400).json({ 
            message: `File ${file.originalname} exceeds maximum size of ${plan.maxFileSize / 1024 / 1024}MB` 
          });
        }
      }

      const createdFiles = [];
      for (const file of uploadedFiles) {
        const created = await storage.createFile({
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          parentId: parentId,
          userId,
          isFolder: false,
        });
        createdFiles.push(created);

        // Log activity
        await storage.createActivity({
          userId,
          fileId: created.id,
          action: "upload",
          details: { fileName: file.originalname },
        });
      }

      // Update storage used
      await storage.updateUserStorage(userId, totalSize);

      res.json({ files: createdFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Create folder
  app.post("/api/files/folder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, parentId } = req.body;

      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Folder name is required" });
      }

      const folder = await storage.createFile({
        name,
        type: "folder",
        size: 0,
        parentId: parentId || null,
        userId,
        isFolder: true,
      });

      await storage.createActivity({
        userId,
        fileId: folder.id,
        action: "create_folder",
        details: { folderName: name },
      });

      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  // Get single file
  app.get("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  // Update file (rename, star, etc.)
  app.patch("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = await storage.getFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { name, isStarred, parentId } = req.body;
      const updates: any = {};
      
      if (name !== undefined) updates.name = name;
      if (isStarred !== undefined) updates.isStarred = isStarred;
      if (parentId !== undefined) updates.parentId = parentId;

      const updated = await storage.updateFile(req.params.id, updates);

      if (name !== undefined) {
        await storage.createActivity({
          userId,
          fileId: file.id,
          action: "rename",
          details: { oldName: file.name, newName: name },
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Delete file (move to trash)
  app.delete("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = await storage.getFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.moveToTrash(req.params.id);

      await storage.createActivity({
        userId,
        fileId: file.id,
        action: "trash",
        details: { fileName: file.name },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Restore from trash
  app.post("/api/files/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = await storage.getFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.restoreFromTrash(req.params.id);

      await storage.createActivity({
        userId,
        fileId: file.id,
        action: "restore",
        details: { fileName: file.name },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error restoring file:", error);
      res.status(500).json({ message: "Failed to restore file" });
    }
  });

  // Permanently delete
  app.delete("/api/files/:id/permanent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = await storage.getFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Delete actual file from disk if exists
      if (file.url && !file.isFolder) {
        const filePath = path.join(process.cwd(), file.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // Update storage used
        await storage.updateUserStorage(userId, -file.size);
      }

      await storage.deleteFilePermanently(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error permanently deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Empty trash
  app.delete("/api/files/trash/empty", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trashedFiles = await storage.getTrashedFiles(userId);
      
      let totalSize = 0;
      for (const file of trashedFiles) {
        if (file.url && !file.isFolder) {
          const filePath = path.join(process.cwd(), file.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          totalSize += file.size;
        }
      }

      await storage.emptyTrash(userId);
      await storage.updateUserStorage(userId, -totalSize);

      res.json({ success: true });
    } catch (error) {
      console.error("Error emptying trash:", error);
      res.status(500).json({ message: "Failed to empty trash" });
    }
  });

  // Download file - validates ownership
  app.get("/api/files/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = await storage.getFile(req.params.id);
      
      if (!file || !file.url) {
        return res.status(404).json({ message: "File not found" });
      }

      // Verify ownership or shared access
      if (file.userId !== userId) {
        // Check if file is shared with this user
        const share = await storage.getShareByFileId(file.id);
        if (!share || (share.sharedWithId && share.sharedWithId !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const filePath = path.join(process.cwd(), file.url);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Log download activity
      await storage.createActivity({
        userId,
        fileId: file.id,
        action: "download",
        details: { fileName: file.name },
      });

      res.download(filePath, file.name);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Subscription routes
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      // Would need to fetch from Stripe here
      res.json({ 
        subscription: {
          id: user.stripeSubscriptionId,
          plan: user.plan,
          status: 'active'
        }
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Checkout (placeholder - would integrate with Stripe)
  app.post("/api/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId } = req.body;

      // This would integrate with Stripe checkout
      // For now, return a placeholder
      res.json({ 
        url: null,
        message: "Stripe checkout integration pending" 
      });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Billing portal (placeholder)
  app.post("/api/billing/portal", isAuthenticated, async (req: any, res) => {
    try {
      // This would create a Stripe billing portal session
      res.json({ 
        url: null,
        message: "Stripe portal integration pending" 
      });
    } catch (error) {
      console.error("Error creating portal:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Serve uploaded files statically
  const express = await import("express");
  app.use("/uploads", express.default.static(uploadDir));

  return httpServer;
}
