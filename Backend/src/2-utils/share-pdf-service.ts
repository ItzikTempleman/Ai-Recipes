import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

type ShareStore = Map<string, any>;

function getStore(): ShareStore {
  (globalThis as any).__sharePayloadStore ??= new Map<string, any>();
  return (globalThis as any).__sharePayloadStore as ShareStore;
}

function makeToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function renderUrlToPdf(shareUrl: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 1600 },
      deviceScaleFactor: 2,
    });

    // iOS symptom fix: cold loads are slower → bump timeouts
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // "networkidle" is flaky for SPAs. Use domcontentloaded + explicit waits.
    await page.goto(shareUrl, { waitUntil: "domcontentloaded" });

    // wait for app root first
    await page.waitForSelector("#share-root", { timeout: 60000 });

    // wait for your ready flag
    await page.waitForFunction(
      () => (window as any).__SHARE_READY__ === true,
      null,
      { timeout: 60000 }
    );

    const root = await page.$("#share-root");
    if (!root) {
      throw new Error("share-root not found");
    }

    const png = await root.screenshot({ type: "png", omitBackground: false });

    const pdfDoc = await PDFDocument.create();
    const img = await pdfDoc.embedPng(png);

    const width = img.width * (72 / 96);
    const height = img.height * (72 / 96);

    const pdfPage = pdfDoc.addPage([width, height]);
    pdfPage.drawImage(img, { x: 0, y: 0, width, height });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

export const sharePdfService = {
  async pdfForRecipeId(frontendBaseUrl: string, recipeId: number): Promise<Buffer> {
    const shareUrl = `${frontendBaseUrl}/share-render/${recipeId}`;
    return renderUrlToPdf(shareUrl);
  },

  createTokenForPayload(payload: any): string {
    const token = makeToken();
    const store = getStore();
    store.set(token, payload);

    // expire after 2 minutes
    setTimeout(() => {
      try { store.delete(token); } catch {}
    }, 2 * 60 * 1000);

    return token;
  },

  getPayload(token: string): any | null {
    const store = getStore();
    return store.get(token) ?? null;
  },

  async pdfForPayloadToken(frontendBaseUrl: string, token: string): Promise<Buffer> {
    const shareUrl = `${frontendBaseUrl}/share-render?token=${encodeURIComponent(token)}`;
    return renderUrlToPdf(shareUrl);
  },
};
