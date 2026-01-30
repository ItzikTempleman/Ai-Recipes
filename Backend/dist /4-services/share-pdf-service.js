"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharePdfService = void 0;
const playwright_1 = require("playwright");
const app_config_1 = require("../2-utils/app-config");
const TIMEOUT_MS = 45_000;
const PDF_CACHE_TTL_MS = 15_000;
const __pdfInflight = new Map();
const __pdfCache = new Map();
function getStore() {
    globalThis.__sharePayloadStore ??= new Map();
    return globalThis.__sharePayloadStore;
}
function makeToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function waitForImages(page, timeoutMs = TIMEOUT_MS) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const allDone = await page.evaluate(() => {
            const imgs = Array.from(document.images || []);
            return imgs.every((img) => img.complete);
        });
        if (allDone)
            return;
        await page.waitForTimeout(150);
    }
}
async function waitForFonts(page, timeoutMs = TIMEOUT_MS) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ready = await page.evaluate(() => {
            return !!document.fonts && document.fonts.status === "loaded";
        });
        if (ready)
            return;
        await page.waitForTimeout(150);
    }
}
async function waitForShareReady(page, timeoutMs = TIMEOUT_MS) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ready = await page.evaluate(() => {
            const v = window.__SHARE_READY__;
            return v === undefined ? true : v === true;
        });
        if (ready)
            return;
        await page.waitForTimeout(150);
    }
}
async function withBrowser(fn) {
    const executablePath = process.env.CHROMIUM_PATH ||
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        undefined;
    const browser = await playwright_1.chromium.launch({
        headless: true,
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    try {
        return await fn(browser);
    }
    finally {
        await browser.close();
    }
}
async function renderUrlToPdfOnceWithIntercept(url, payload, opts = {}) {
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
            .catch(() => { });
        const targetSelector = "#recipe-print-root";
        const widthPx = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el)
                return null;
            const rect = el.getBoundingClientRect();
            return Math.ceil(rect.width);
        }, targetSelector);
        if (!widthPx)
            throw new Error("Failed to measure recipe-print-root width");
        const pdf = await page.pdf({
            printBackground: true,
            // Let CSS @page control size+margin (we added it in ShareRenderPage.css)
            preferCSSPageSize: true,
            // Do not force margins here (CSS @page handles it)
            margin: undefined,
            // Do not set width when printing to A4 via CSS
            width: undefined,
            format: undefined,
            scale: 1,
        });
        await page.close();
        return Buffer.from(pdf);
    });
}
async function renderUrlToPdf(url, opts = {}) {
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
            if (document.fonts?.ready)
                await document.fonts.ready;
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
            const el = document.querySelector(sel);
            if (!el)
                return null;
            const rect = el.getBoundingClientRect();
            return Math.ceil(rect.width);
        }, targetSelector);
        if (!widthPx)
            throw new Error("Failed to measure recipe-print-root width");
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
async function renderUrlToPdfOnce(url, opts = {}) {
    const key = `${url}|a4=${opts.a4 !== false}`;
    const cached = __pdfCache.get(key);
    if (cached && Date.now() - cached.at < PDF_CACHE_TTL_MS)
        return cached.buf;
    const inflight = __pdfInflight.get(key);
    if (inflight)
        return inflight;
    const p = (async () => {
        try {
            const buf = await renderUrlToPdf(url, opts);
            __pdfCache.set(key, { at: Date.now(), buf });
            return buf;
        }
        finally {
            __pdfInflight.delete(key);
        }
    })();
    __pdfInflight.set(key, p);
    return p;
}
exports.sharePdfService = {
    createTokenForPayload(payload) {
        const token = makeToken();
        getStore().set(token, payload);
        // WAS: 10 * 60 * 1000 (10 minutes)
        // CHANGE TO: 24 hours (or whatever you want)
        setTimeout(() => {
            getStore().delete(token);
        }, 24 * 60 * 60 * 1000).unref?.();
        return token;
    },
    getPayload(token) {
        return getStore().get(token) ?? null;
    },
    async pdfForRecipeId(frontendBaseUrl, recipeId) {
        const base = frontendBaseUrl || app_config_1.appConfig.frontendBaseUrl;
        const url = `${base.replace(/\/$/, "")}/share-render/${recipeId}`;
        return renderUrlToPdfOnce(url, { a4: true });
    },
    async pdfForPayloadToken(frontendBaseUrl, token) {
        const payload = exports.sharePdfService.getPayload(token);
        if (!payload)
            throw new Error("Share payload expired");
        const base = frontendBaseUrl || app_config_1.appConfig.frontendBaseUrl;
        const url = `${base.replace(/\/$/, "")}/share-render/0?token=${encodeURIComponent(token)}`;
        return renderUrlToPdfOnce(url, { a4: true });
    },
    async pdfForShareToken(frontendBaseUrl, shareToken) {
        const base = frontendBaseUrl || app_config_1.appConfig.frontendBaseUrl;
        const url = `${base.replace(/\/$/, "")}/share-render/0?token=${encodeURIComponent(shareToken)}`;
        return renderUrlToPdfOnce(url, { a4: true });
    },
    async pdfForPayloadInjected(frontendBaseUrl, payload) {
        const base = frontendBaseUrl || app_config_1.appConfig.frontendBaseUrl;
        const url = `${base.replace(/\/$/, "")}/share-render/0?token=injected`;
        return await renderUrlToPdfOnceWithIntercept(url, payload, { a4: true });
    },
};
