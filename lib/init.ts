import { startCleanupCron } from "./cron";

if (process.env.NODE_ENV !== "test") {
  startCleanupCron();
}
