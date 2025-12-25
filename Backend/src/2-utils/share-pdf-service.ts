import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ShareStore = Map<string, any>;

function getStore(): ShareStore {
  (globalThis as any).__sharePayloadStore ??= new Map<string, any>();
  return (globalThis as any).__sharePayloadStore as ShareStore;
}

function makeToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function safeStr(v: any): string {
  return (v ?? "").toString().trim();
}

function asArray(v: any): string[] {
  if (Array.isArray(v)) return v.map(x => safeStr(x)).filter(Boolean);
  return [];
}

function wrapText(text: string, maxChars: number): string[] {
  const words = safeStr(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function tryFetchImageBytes(url: string): Promise<{ bytes: Uint8Array; type: "png" | "jpg" } | null> {
  const u = safeStr(url);
  if (!u) return null;
  try {
    const res = await fetch(u);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    const buf = new Uint8Array(await res.arrayBuffer());
    if (ct.includes("png")) return { bytes: buf, type: "png" };
    if (ct.includes("jpeg") || ct.includes("jpg")) return { bytes: buf, type: "jpg" };
    // try both (best-effort)
    return { bytes: buf, type: "png" };
  } catch {
    return null;
  }
}

async function recipeToPdfBytes(recipe: any): Promise<Buffer> {
  const title = safeStr(recipe?.title) || "Recipe";
  const description = safeStr(recipe?.description);
  const servings = Number(recipe?.amountOfServings ?? recipe?.amountOfServings ?? 1) || 1;

  const ingredients = asArray(recipe?.data?.ingredients ?? recipe?.ingredients);
  const instructions = asArray(recipe?.data?.instructions ?? recipe?.instructions);

  const imageUrl =
    safeStr(recipe?.imageUrl) ||
    safeStr(recipe?.image) ||
    (safeStr(recipe?.imageName) ? safeStr(recipe?.imageName) : "");

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();

  const margin = 44;
  let y = height - margin;

  const drawLines = (lines: string[], opts: { size: number; bold?: boolean; leading?: number } ) => {
    const size = opts.size;
    const leading = opts.leading ?? Math.ceil(size * 1.25);
    const f = opts.bold ? fontBold : font;
    for (const line of lines) {
      if (y < margin + leading) break;
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(0,0,0) });
      y -= leading;
    }
  };

  // Title
  drawLines(wrapText(title, 44), { size: 20, bold: true, leading: 26 });
  y -= 6;

  // Meta
  drawLines([`Servings: ${servings}`], { size: 11, bold: false, leading: 16 });
  y -= 8;

  // Optional image (best-effort)
  const img = await tryFetchImageBytes(imageUrl);
  if (img) {
    try {
      const embedded = img.type === "jpg" ? await pdfDoc.embedJpg(img.bytes) : await pdfDoc.embedPng(img.bytes);
      const maxW = width - margin * 2;
      const maxH = 220;
      const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
      const w = embedded.width * scale;
      const h = embedded.height * scale;
      if (y - h > margin + 40) {
        page.drawImage(embedded, { x: margin, y: y - h, width: w, height: h });
        y -= h + 14;
      }
    } catch {
      // ignore image failures
    }
  }

  // Description
  if (description) {
    drawLines(wrapText(description, 88), { size: 11, leading: 15 });
    y -= 10;
  }

  // Ingredients
  drawLines(["Ingredients"], { size: 13, bold: true, leading: 18 });
  const ingLines: string[] = [];
  for (const ing of ingredients) {
    const parts = wrapText(`• ${ing}`, 92);
    ingLines.push(...parts);
  }
  drawLines(ingLines.length ? ingLines : ["(none)"], { size: 11, leading: 15 });
  y -= 12;

  // Instructions
  drawLines(["Instructions"], { size: 13, bold: true, leading: 18 });
  const insLines: string[] = [];
  let i = 1;
  for (const step of instructions) {
    const parts = wrapText(`${i}. ${step}`, 92);
    insLines.push(...parts);
    insLines.push(""); // spacing
    i++;
  }
  drawLines(insLines.length ? insLines : ["(none)"], { size: 11, leading: 15 });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export const sharePdfService = {
  // keep token store for guest GET flows if you already wired them
  createTokenForPayload(payload: any): string {
    const token = makeToken();
    const store = getStore();
    store.set(token, payload);
    setTimeout(() => { try { store.delete(token); } catch {} }, 2 * 60 * 1000);
    return token;
  },

  getPayload(token: string): any | null {
    return getStore().get(token) ?? null;
  },

  async pdfForRecipePayload(payload: any): Promise<Buffer> {
    return recipeToPdfBytes(payload);
  },

  async pdfForRecipeId(_frontendBaseUrl: string, recipeId: number): Promise<Buffer> {
    // kept for compatibility; controller should pass recipe payload now
    throw new Error(`pdfForRecipeId not supported here. Use pdfForRecipePayload with recipe data. recipeId=${recipeId}`);
  },

  async pdfForPayloadToken(_frontendBaseUrl: string, token: string): Promise<Buffer> {
    const payload = sharePdfService.getPayload(token);
    if (!payload) throw new Error("Share payload expired");
    return recipeToPdfBytes(payload);
  },
};
