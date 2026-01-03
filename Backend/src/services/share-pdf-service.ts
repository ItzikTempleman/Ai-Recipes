import { chromium, Browser } from "playwright";
import { appConfig } from "../utils/app-config";

type ShareStore = Map<string, any>;

const TIMEOUT_MS = 45_000;
const PDF_CACHE_TTL_MS = 15_000;
const __pdfInflight = new Map<string, Promise<Buffer>>();
const __pdfCache = new Map<string, { at: number; buf: Buffer }>();

function getStore(): ShareStore {
  (globalThis as any).__sharePayloadStore ??= new Map<string, any>();
  return (globalThis as any).__sharePayloadStore as ShareStore;
}

function makeToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function waitForImages(page: any, timeoutMs = TIMEOUT_MS) {
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

async function waitForFonts(page: any, timeoutMs = TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => {
      return !!document.fonts && document.fonts.status === "loaded";
    });
    if (ready) return;
    await page.waitForTimeout(150);
  }
}

async function waitForShareReady(page: any, timeoutMs = TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => {
      const v = (window as any).__SHARE_READY__;
      return v === undefined ? true : v === true;
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
  a4?: boolean;
};

async function renderUrlToPdfOnceWithIntercept(url: string, payload: any, opts: PdfOptions = {}): Promise<Buffer> {
  // No cache key reuse here to avoid mixing payloads; keep it simple/reliable
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();

    // ✅ Intercept the payload fetch from the share-render page and inject JSON
    await page.route("**/api/share-payload/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify(payload),
      });
    });

    page.setDefaultTimeout(TIMEOUT_MS);

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Let React finish rendering
    await page.waitForSelector("#recipe-print-root", { state: "attached" });

    // Wait for fonts/layout settle a bit
    await page.waitForTimeout(150);

    // (Optional) Wait for images if you want (your file already has waitForImages)
    await waitForImages(page, TIMEOUT_MS);

    // Inject print CSS (same style block you already use)
    await page
      .addStyleTag({
        content: `
          @page { margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; }
        `,
      })
      .catch(() => {});

    const targetSelector = "#recipe-print-root";

    const widthPx = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return Math.ceil(rect.width);
    }, targetSelector);

    if (!widthPx) throw new Error("Failed to measure recipe-print-root width");

 const pdf = await page.pdf({
  printBackground: true,

  // Let CSS @page control size+margin (we added it in ShareRenderPage.css)
  preferCSSPageSize: true,

  // Do not force margins here (CSS @page handles it)
  margin: undefined as any,

  // Do not set width when printing to A4 via CSS
  width: undefined as any,
  format: undefined as any,

  scale: 1,
});

    await page.close();
    return Buffer.from(pdf);
  });
}

async function renderUrlToPdf(url: string, opts: PdfOptions = {}): Promise<Buffer> {
  return await withBrowser(async (browser) => {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 1,
    });

    await page
      .addStyleTag({
        content: `
          * { animation: none !important; transition: none !important; }
          @page { margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; }
        `,
      })
      .catch(() => { });

    await page.goto(url, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
    await page.emulateMedia({ media: "print" });
    await waitForImages(page, TIMEOUT_MS);
    await page
      .evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      })
      .catch(() => { });
    await waitForFonts(page, TIMEOUT_MS);
    await waitForShareReady(page, TIMEOUT_MS);
    const targetSelector = "#recipe-print-root";
    await page.waitForSelector(targetSelector, { state: "attached", timeout: TIMEOUT_MS });
    await page
      .addStyleTag({
        content: `
          html, body { background: transparent !important; }
          ${targetSelector} {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }`,
      })
      .catch(() => { });

    const widthPx = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return Math.ceil(rect.width);
    }, targetSelector);
    if (!widthPx) throw new Error("Failed to measure recipe-print-root width");
    const pdf = await page.pdf({
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      width: `${widthPx}px`,
      format: opts.a4 === false ? "Letter" : "A4",
      preferCSSPageSize: false,
      scale: 1,
    });

    await page.close();
    return Buffer.from(pdf);
  });
}
async function renderUrlToPdfOnce(url: string, opts: PdfOptions = {}): Promise<Buffer> {
  const key = `${url}|a4=${opts.a4 !== false}`;
  const cached = __pdfCache.get(key);
  if (cached && Date.now() - cached.at < PDF_CACHE_TTL_MS) return cached.buf;
  const inflight = __pdfInflight.get(key);
  if (inflight) return inflight;
  const p = (async () => {
    try {
      const buf = await renderUrlToPdf(url, opts);
      __pdfCache.set(key, { at: Date.now(), buf });
      return buf;
    } finally {
      __pdfInflight.delete(key);
    }
  })();

  __pdfInflight.set(key, p);
  return p;
}

export const sharePdfService = {

    createTokenForPayload(payload: any): string {
    const token = makeToken();
    getStore().set(token, payload);

    // WAS: 10 * 60 * 1000 (10 minutes)
    // CHANGE TO: 24 hours (or whatever you want)
    setTimeout(() => {
      getStore().delete(token);
    }, 24 * 60 * 60 * 1000).unref?.();

    return token;
  },

  getPayload(token: string): any | null {
    return getStore().get(token) ?? null;
  },

  async pdfForRecipeId(frontendBaseUrl: string, recipeId: number): Promise<Buffer> {
    const base = frontendBaseUrl || appConfig.frontendBaseUrl;
    const url = `${base.replace(/\/$/, "")}/share-render/${recipeId}`;
    return renderUrlToPdfOnce(url, { a4: true });
  },

  async pdfForPayloadToken(frontendBaseUrl: string, token: string): Promise<Buffer> {
    const payload = sharePdfService.getPayload(token);
    if (!payload) throw new Error("Share payload expired");
    const base = frontendBaseUrl || appConfig.frontendBaseUrl;
    const url = `${base.replace(/\/$/, "")}/share-render/0?token=${encodeURIComponent(token)}`;
    return renderUrlToPdfOnce(url, { a4: true });
  },

  async pdfForShareToken(frontendBaseUrl: string, shareToken: string): Promise<Buffer> {
    const base = frontendBaseUrl || appConfig.frontendBaseUrl;
    const url = `${base.replace(/\/$/, "")}/share-render/0?token=${encodeURIComponent(shareToken)}`;
    return renderUrlToPdfOnce(url, { a4: true });
  },
  async pdfForPayloadInjected(frontendBaseUrl: string, payload: any): Promise<Buffer> {
  const base = frontendBaseUrl || appConfig.frontendBaseUrl;
  const url = `${base.replace(/\/$/, "")}/share-render/0?token=injected`;

  return await renderUrlToPdfOnceWithIntercept(url, payload, { a4: true });
},
};