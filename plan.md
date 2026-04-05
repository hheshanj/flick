# TempShare Implementation Plan

Based on the project requirements in `PROMPT.md`, here is the phased approach for building TempShare.

## Phase 1: Project Setup and Infrastructure
- Initialize Next.js project with App Router and Tailwind CSS (`npx create-next-app`).
- Install necessary dependencies (`prisma`, `@prisma/client`, `nanoid`, `node-cron`).
- Set up Prisma with SQLite.
- Configure environment variables (`DATABASE_URL`, `UPLOAD_DIR`, `MAX_FILE_SIZE_BYTES`, `BASE_URL`).
- Scaffold core project directories (`lib`, `prisma`, `uploads`).

## Phase 2: Database & Utilities
- Define the `Share` Prisma schema (id, token, fileName, filePath, fileSize, mimeType, expiresAt, createdAt).
- Push schema to SQLite database.
- Create Prisma client singleton (`lib/prisma.ts`).
- Create utility functions for `nanoid` token generation.

## Phase 3: Upload Functionality (Backend & Frontend)
- Build the `POST /api/upload` endpoint to parse multipart/form-data.
- Handle server-side file and size validation.
- Save file securely to the local disk and insert the `Share` record into the database.
- Build the Upload UI (`app/page.tsx`) featuring a drag-and-drop zone, client-side validation (<1GB), duration picker (1-120 mins), and submission feedback.

## Phase 4: Share Page & File Serving
- Develop the Share Page UI (`app/s/[token]/page.tsx`).
- Fetch token data, handle "expired/not found" states.
- Implement the live client-side countdown timer for valid files.
- Build the `GET /api/download/[token]` endpoint.
- Ensure strict server-side validation against `expiresAt` before streaming the file with proper `Content-Disposition` headers.

## Phase 5: Cleanup Cron Job & Final Polish
- Set up a robust `node-cron` singleton (`lib/cron.ts`) to run every 60 seconds.
- Implement the DB query to find expired records, delete them from the file system, and remove the database rows.
- Address edge cases (e.g., handling missing files on disk gracefully during cleanup, disk space checks).
- Provide final aesthetic polishing to ensure a fast, minimal, and premium user experience (glassmorphism/vibrant dark mode).
