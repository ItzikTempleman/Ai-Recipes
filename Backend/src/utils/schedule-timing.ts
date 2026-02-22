import cron from "node-cron";
import { suggestionsService } from "../services/suggestions-service";

const ISRAEL_TZ = "Asia/Jerusalem";

export function startSuggestionsSchedulers(): void {

  void (async () => {
    try {
      await suggestionsService.generateToday();
    } catch (err) {
      console.error("[boot] failed generating daily suggestions:", err);
    }
  })();

  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        await suggestionsService.generateToday();
      } catch (err) {
        console.error("[cron] failed generating daily suggestions:", err);
      }
    },
    { timezone: ISRAEL_TZ }
  );
}