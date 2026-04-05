# TempShare — Build Prompt

## Project overview

Build **TempShare**, a web app for ephemeral file sharing. Users upload any file (up to 1GB, any format — video, audio, text, images, archives, etc.), choose how long the link should last (1–120 minutes), and get a short shareable URL. When the timer expires, the file and its record are permanently deleted automatically.

---

## Tech stack

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: Next.js API routes (keep it a monorepo)
- **Database**: SQLite via Prisma
- **File storage**: Local disk (`/uploads` directory on the server)
- **Cleanup**: `node-cron` job running every 60 seconds to delete expired files
- **Token generation**: `nanoid` (10-character URL-safe tokens)
- **Upload handling**: `multer` with a 1GB size limit

---

## Database schema

```prisma
model Share {
  id         String   @id @default(uuid())
  token      String   @unique
  fileName   String
  filePath   String
  fileSize   BigInt
  mimeType   String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
}
```

---

## Features to build

### 1. Upload page (`/`)
- Drag-and-drop zone that accepts any file type
- File size validation on the client (reject > 1GB with a clear error)
- Duration picker: slider or segmented control for 5, 10, 15, 30, 60, 90, 120 minutes
- On submit: POST to `/api/upload`, display the generated share URL with a copy button
- Show a small preview of file name, size, and expiry time after upload

### 2. Upload API (`POST /api/upload`)
- Accept multipart form data
- Validate file size server-side (hard reject > 1GB)
- Save file to `/uploads/{uuid}-{originalname}`
- Create a `Share` record in the DB with `expiresAt = now + chosen minutes`
- Return `{ token, expiresAt, shareUrl }`

### 3. Share page (`/s/[token]`)
- Look up the token in the DB
- If not found or `expiresAt` is in the past → show "This file has expired or doesn't exist" screen
- If valid → show file name, size, MIME type, and a live countdown timer (updates every second in the browser)
- "Download" button that hits `/api/download/[token]`

### 4. Download API (`GET /api/download/[token]`)
- Re-check expiry server-side before serving — do not trust the share page alone
- If expired → 410 Gone
- If valid → stream the file with correct `Content-Disposition` and `Content-Type` headers

### 5. Cleanup cron job
- Runs every 60 seconds using `node-cron`
- Query: `SELECT * FROM shares WHERE expiresAt < now()`
- For each expired record: delete the file from disk, then delete the DB row
- Log deletions (file name + token) to stdout
- Initialize the cron in a singleton so it doesn't spawn multiple instances in Next.js dev mode

---

## Edge cases to handle

- File already expired between page load and download click (re-check on download endpoint)
- `nanoid` token collision (use `uuid` as the internal ID, token is only for the URL)
- Disk space cap: check available space before accepting upload, reject with 507 if below a threshold (e.g. 500MB free)
- Concurrent uploads don't conflict (use uuid-prefixed filenames)
- Cleanup cron should handle missing files gracefully (file may have been manually deleted)

---

## Project structure

```
tempshare/
├── app/
│   ├── page.tsx                  # Upload UI
│   ├── s/[token]/page.tsx        # Share page
│   └── api/
│       ├── upload/route.ts
│       └── download/[token]/route.ts
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   └── cron.ts                  # Cleanup cron job
├── prisma/
│   └── schema.prisma
├── uploads/                      # gitignored, files land here
├── .env
└── package.json
```

---

## Environment variables

```env
DATABASE_URL="file:./dev.db"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_BYTES=1073741824
BASE_URL="http://localhost:3000"
```

---

## Notes

- Keep the UI minimal and fast — this is a utility tool, not a social app
- No authentication, no accounts — the token IS the access control, so make it unguessable (nanoid length 10 is fine)
- The share URL format should be `{BASE_URL}/s/{token}`
- Do not expose internal file paths or UUIDs in any API response
- The countdown timer on the share page is purely cosmetic — always re-validate server-side on download
