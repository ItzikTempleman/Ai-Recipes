import cron from "node-cron";
import { suggestionsService } from "../services/suggestions-service";

const ISRAEL_TZ = "Asia/Jerusalem";

let started = false;

export function startSuggestionsSchedulers(): void {
 
  if (started) return;
  started = true;

 
  const enabled = String(process.env.ENABLE_SUGGESTIONS_SCHEDULER ?? "").toLowerCase() === "true";
  if (!enabled) {
    console.log("[scheduler] suggestions scheduler disabled (ENABLE_SUGGESTIONS_SCHEDULER!=true)");
    return;
  }

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

  console.log("[scheduler] suggestions scheduler started");
}


  export function getTodayDateString(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(new Date());
  }