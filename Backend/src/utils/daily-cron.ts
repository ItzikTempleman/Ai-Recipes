import cron from "node-cron";
import { suggestionsService } from "../services/suggestions-service";

const ISRAEL_TZ = "Asia/Jerusalem";

/**
 * Schedules generation of today's 5 suggestions every day at 00:00 Israel time.
 * Safe to call multiple times (generateToday() is already idempotent by date).
 */
export function startDailySuggestionsCron() {
  // Run at 00:00 every day, Israel time
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("[cron] 00:00 IL -> generating daily suggestions...");
        await suggestionsService.generateToday();
        console.log("[cron] done generating daily suggestions");
      } catch (err) {
        console.error("[cron] failed generating daily suggestions:", err);
      }
    },
    { timezone: ISRAEL_TZ }
  );

  console.log(`[cron] Daily suggestions scheduled for 00:00 (${ISRAEL_TZ})`);
}