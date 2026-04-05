import { prisma } from "./prisma";
import * as fs from "fs";
import * as path from "path";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || "./uploads";
}

async function cleanupExpiredFiles(): Promise<void> {
  const now = new Date();
  
  const expiredShares = await prisma.share.findMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  for (const share of expiredShares) {
    try {
      const filePath = path.resolve(share.filePath);
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      
      await prisma.share.delete({
        where: { id: share.id },
      });

      console.log(`[Cleanup] Deleted file: ${share.fileName} (token: ${share.token})`);
    } catch (error) {
      console.error(`[Cleanup] Error deleting share ${share.token}:`, error);
    }
  }
}

const globalForCron = globalThis as unknown as { cronStarted: boolean | undefined };

export function startCleanupCron(): void {
  if (globalForCron.cronStarted) return;
  globalForCron.cronStarted = true;

  if (!fs.existsSync(getUploadDir())) {
    fs.mkdirSync(getUploadDir(), { recursive: true });
  }

  const cron = require("node-cron");
  
  cron.schedule("* * * * *", async () => {
    try {
      await cleanupExpiredFiles();
    } catch (error) {
      console.error("[Cleanup Cron] Error:", error);
    }
  });

  console.log("[Cleanup Cron] Started - running every 60 seconds");
}
