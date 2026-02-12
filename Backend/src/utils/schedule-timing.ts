import cron from "node-cron";
import { suggestionsService } from "../services/suggestions-service";

export function startDailySuggestionsCron() {
  cron.schedule( "0 0 * * *", async () => {
      try {
        await suggestionsService.generateToday();
      } catch (err) {
        console.error("[cron] failed generating daily suggestions:", err);
      }
    }, { timezone: "Asia/Jerusalem" }
  );
}

void(
  async () => {
      try {
        await suggestionsService.generateToday();
      } catch (err) {
        console.error("[cron] failed generating daily suggestions:", err);
      }
    }
  )();
