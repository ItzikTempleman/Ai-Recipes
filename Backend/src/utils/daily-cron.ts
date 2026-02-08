import cron from "node-cron";
import { suggestionsService } from "../services/suggestions-service";

const ISRAEL_TZ = "Asia/Jerusalem";

export function startDailySuggestionsCron() {

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