# Cloud Hammy's - Cloud Storage Platform

## Overview
Cloud Hammy's is a modern cloud storage platform similar to Google Drive, built with React, Express, and PostgreSQL. Users can upload, organize, share, and preview files with a beautiful, responsive interface.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 11, 2025

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **File Storage**: Local filesystem (uploads directory)
- **Payments**: Stripe integration (configured)

## Project Architecture

### Directory Structure
```
client/
  src/
    components/     # Reusable UI components
    context/        # React context providers (Theme)
    hooks/          # Custom hooks (useAuth)
    lib/            # Utilities and API helpers
    pages/          # Route components
server/
  db.ts            # Database connection
  routes.ts        # API endpoints
  storage.ts       # Database operations
  replitAuth.ts    # Authentication setup
shared/
  schema.ts        # Database schema and types
uploads/           # Uploaded files storage
```

### Key Features
1. **File Management**: Upload, download, rename, move, star, trash files
2. **Folder Organization**: Create folders, nested navigation with breadcrumbs
3. **File Preview**: Image, video, audio, and PDF preview modals
4. **Sharing**: Generate shareable links with password protection and expiry
5. **Views**: Grid and list views with sorting options
6. **Search**: Filter files by name
7. **Trash**: Soft delete with 30-day retention and restore capability
8. **Storage Quotas**: Per-plan storage limits with visual meter

### Subscription Plans
- **Free**: 5GB storage, 100MB max file size
- **Pro**: 100GB storage, 500MB max file size, IDR 29,900/month
- **Business**: 1TB storage, 2GB max file size, IDR 99,900/month
- **Enterprise**: Unlimited storage, custom pricing

## API Endpoints

### Authentication
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/callback` - OAuth callback
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Files
- `GET /api/files` - List files in folder
- `GET /api/files/starred` - List starred files
- `GET /api/files/recent` - List recent files
- `GET /api/files/trash` - List trashed files
- `GET /api/files/shared` - List files shared with user
- `POST /api/files/upload` - Upload files
- `POST /api/files/folder` - Create folder
- `GET /api/files/:id` - Get file details
- `PATCH /api/files/:id` - Update file (rename, star)
- `DELETE /api/files/:id` - Move to trash
- `POST /api/files/:id/restore` - Restore from trash
- `DELETE /api/files/:id/permanent` - Delete permanently
- `GET /api/files/:id/download` - Download file

### Billing
- `GET /api/subscription` - Get current subscription
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Create billing portal session

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit app ID (for OAuth)
- `ISSUER_URL` - Replit OAuth issuer URL

## User Preferences
- Theme: Light/Dark mode toggle with localStorage persistence
- View Mode: Grid/List preference per session

## Recent Changes
- December 11, 2025: Initial MVP implementation
  - Complete database schema with users, files, shares, activities
  - Full frontend with Landing, Drive, Billing, and management pages
  - Backend with Replit Auth, file upload/download, folder management
  - Secure file access with ownership validation
