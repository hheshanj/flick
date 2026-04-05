import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { startCleanupCron } from "@/lib/cron";
import { nanoid } from "nanoid";
import * as crypto from "crypto";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES || "1073741824");
const MIN_FREE_SPACE = parseInt(process.env.MIN_FREE_SPACE_BYTES || "524288000");
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function checkDiskSpace(): boolean {
  try {
    const stats = fs.statfsSync ? fs.statfsSync(UPLOAD_DIR) : null;
    if (stats) {
      const freeBytes = stats.bfree * stats.bsize;
      return freeBytes >= MIN_FREE_SPACE;
    }
  } catch {
    return true;
  }
  return true;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  startCleanupCron();

  try {
    if (!checkDiskSpace()) {
      return NextResponse.json(
        { error: "Insufficient disk space" },
        { status: 507 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const durationStr = formData.get("duration") as string | null;
    const password = formData.get("password") as string | null;
    const maxDownloadsStr = formData.get("maxDownloads") as string | null;
    const uniqueIpLimitStr = formData.get("uniqueIpLimit") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const duration = parseInt(durationStr || "15", 10);
    if (isNaN(duration) || duration < 1) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Total file size limits exceeded" }, { status: 400 });
    }

    const maxDownloads = maxDownloadsStr ? parseInt(maxDownloadsStr, 10) : 0;
    if (maxDownloadsStr && (isNaN(maxDownloads) || maxDownloads < 0)) {
      return NextResponse.json({ error: "Invalid download limit" }, { status: 400 });
    }

    const uuid = uuidv4();
    const isMultiple = files.length > 1;
    const safeName = isMultiple ? `flick-bundle.zip` : files[0].name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${uuid}-${safeName}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (isMultiple) {
      const archiver = (await import("archiver")).default;
      const archive = archiver("zip", { zlib: { level: 9 } });
      const output = fs.createWriteStream(filePath);
      archive.pipe(output);
      
      for (const file of files) {
        const { PassThrough } = await import("stream");
        const pt = new PassThrough();
        archive.append(pt, { name: file.name });
        
        // Let the web stream write passively into the PassThrough pipe
        (async () => {
          // @ts-ignore
          for await (const chunk of file.stream()) {
            pt.write(Buffer.from(chunk));
          }
          pt.end();
        })();
      }
      
      await archive.finalize();
      
      // Wait for output write stream to reliably close
      await new Promise<void>((resolve) => output.on("close", () => resolve()));
    } else {
      const fileStream = fs.createWriteStream(filePath);
      // @ts-ignore
      for await (const chunk of files[0].stream()) {
        fileStream.write(Buffer.from(chunk));
      }
      fileStream.end();
      await new Promise<void>((resolve) => fileStream.on("close", () => resolve()));
    }

    const token = nanoid(10);

    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const share = await prisma.share.create({
      data: {
        token,
        fileName: safeName,
        filePath,
        fileSize: BigInt(totalSize),
        mimeType: isMultiple ? "application/zip" : (files[0].type || "application/octet-stream"),
        expiresAt,
        password: password ? hashPassword(password) : null,
        maxDownloads: maxDownloads || 0,
        uniqueIpLimit: uniqueIpLimitStr === "true",
      },
    });

    const shareUrl = `${BASE_URL}/s/${token}`;

    return NextResponse.json({
      token: share.token,
      expiresAt: share.expiresAt.toISOString(),
      shareUrl,
      hasPassword: !!password,
      maxDownloads: share.maxDownloads || null,
      uniqueIpLimit: share.uniqueIpLimit,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String((error as Error)?.stack || error) },
      { status: 500 }
    );
  }
}
