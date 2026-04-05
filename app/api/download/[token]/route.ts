import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface RouteParams {
  params: Promise<{ token: string }>;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const url = new URL(req.url);
    const password = url.searchParams.get("password");

    const share = await prisma.share.findUnique({
      where: { token },
    });

    if (!share) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (share.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "File has expired" },
        { status: 410 }
      );
    }

    if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 403 }
      );
    }

    if (share.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
      if (hashPassword(password) !== share.password) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    const filePath = path.resolve(share.filePath);

    if (!fs.existsSync(filePath)) {
      await prisma.share.delete({ where: { id: share.id } });
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    await prisma.share.update({
      where: { id: share.id },
      data: { downloadCount: { increment: 1 } },
    });

    const fileStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(webStream as any, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(share.fileName)}"`,
        "Content-Type": share.mimeType,
        "Content-Length": share.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
