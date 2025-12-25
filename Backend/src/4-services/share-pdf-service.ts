import { chromium, Browser } from "playwright";
import { appConfig } from "../2-utils/app-config";

type ShareStore = Map<string, any>;

function getStore(): ShareStore {
  (globalThis as any).__sharePayloadStore ??= new Map<string, any>();
  return (globalThis as any).__sharePayloadStore as ShareStore;
}

function makeToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function waitForImages(page: any, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const allDone = await page.evaluate(() => {
      const imgs = Array.from(document.images || []);
      return imgs.every((img) => (img as HTMLImageElement).complete);
    });
    if (allDone) return;
    await page.waitForTimeout(150);
  }
}

async function waitForFonts(page: any, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => {
      // @ts-ignore
      return !!document.fonts && document.fonts.status === "loaded";
    });
    if (ready) return;
    await page.waitForTimeout(150);
  }
}

async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const executablePath =
    process.env.CHROMIUM_PATH ||
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    undefined;

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

type PdfOptions = {
  /**
   * Use A4 pages (recommended). If false, uses US Letter.
   * A4 is more consistent across devices/viewers.
   */
  a4?: boolean;
};

async function renderUrlToPdf(url: string, opts: PdfOptions = {}): Promise<Buffer> {
  return await withBrowser(async (browser) => {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 1,
    });

    // Deterministic output: remove animations + remove print margins
    await page
      .addStyleTag({
        content: `
          * { animation: none !important; transition: none !important; }
          @page { margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; }
        `,
      })
      .catch(() => {});

    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for layout stability factors
    await waitForImages(page, 20000);
    await page
      .evaluate(async () => {
        // @ts-ignore
        if (document.fonts?.ready) await document.fonts.ready;
      })
      .catch(() => {});
    await waitForFonts(page, 20000);

    const targetSelector = "#recipe-print-root";

    // Ensure wrapper exists
    await page.waitForSelector(targetSelector, { state: "attached", timeout: 20000 });

    /**
     * IMPORTANT:
     * Do NOT force `overflow: visible` on every descendant (`${targetSelector} *`)
     * because it can break tables/cards that rely on overflow for layout.
     *
     * We only ensure:
     * - body has no padding/margins
     * - wrapper doesn't add extra padding
     * - wrapper background is transparent
     */
    await page
      .addStyleTag({
        content: `
          html, body { background: transparent !important; }
          ${targetSelector} {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
        `,
      })
      .catch(() => {});

    // Measure wrapper width accurately
    const widthPx = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      // Use rect.width for actual rendered width (what you want 1:1)
      return Math.ceil(rect.width);
    }, targetSelector);

    if (!widthPx) throw new Error("Failed to measure recipe-print-root width");

    /**
     * Core fix for your “cut off / no continuation”:
     * - stop trying to make one giant custom-height page (many viewers truncate it)
     * - instead: set a fixed width and let PDF paginate normally
     *
     * This still looks like a clean invoice/boarding-pass PDF:
     * - width matches the card 1:1
     * - no site chrome
     * - backgrounds/shadows kept
     */
    const pdf = await page.pdf({
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },

      // force the content width to be exactly the recipe card width
      width: `${widthPx}px`,

      // choose paper size for pagination consistency
      format: opts.a4 === false ? "Letter" : "A4",

      // DO NOT set custom height; let it paginate
      preferCSSPageSize: false,
     scale: 1
    });

    await page.close();
    return Buffer.from(pdf);
  });
}

export const sharePdfService = {
  // ===== token store =====
  createTokenForPayload(payload: any): string {
    const token = makeToken();
    getStore().set(token, payload);

    // auto-expire after 10 minutes
    setTimeout(() => {
      getStore().delete(token);
    }, 10 * 60 * 1000).unref?.();

    return token;
  },

  getPayload(token: string): any | null {
    return getStore().get(token) ?? null;
  },

  // ===== PDFs =====
  async pdfForRecipeId(frontendBaseUrl: string, recipeId: number): Promise<Buffer> {
    const base = frontendBaseUrl || appConfig.frontendBaseUrl;
    const url = `${base.replace(/\/$/, "")}/share-render/${recipeId}`;
    return renderUrlToPdf(url, { a4: true });
  },

  async pdfForPayloadToken(frontendBaseUrl: string, token: string): Promise<Buffer> {
    const payload = sharePdfService.getPayload(token);
    if (!payload) throw new Error("Share payload expired");

    const base = frontendBaseUrl || appConfig.frontendBaseUrl;
    const url = `${base.replace(/\/$/, "")}/share-render/0?token=${encodeURIComponent(token)}`;
    return renderUrlToPdf(url, { a4: true });
  },
};
