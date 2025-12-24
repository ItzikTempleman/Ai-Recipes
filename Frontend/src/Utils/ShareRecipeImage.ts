import html2canvas from "html2canvas";
import { type RefObject } from "react";
import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "./Notify";

/**
 * Goal:
 * - iPhone Chrome: do NOT call navigator.share after long async capture (often NotAllowedError).
 *   => Always download (reliable), user shares from Photos/Files.
 * - Android / Desktop: try native share-with-files, then clipboard, then download.
 * - Capture should look like the on-screen UI (no injected capture CSS hacks).
 */

type Html2CanvasOptionsCompat = {
  scale?: number;
  backgroundColor?: string | null;
  useCORS?: boolean;
  allowTaint?: boolean;
  scrollX?: number;
  scrollY?: number;
  windowWidth?: number;
  windowHeight?: number;
};

type ShareRecipeArgs = { recipeName: string };

export type ShareResult =
  | { ok: true; method: "native-share" | "clipboard" | "download"; file: File }
  | { ok: false; error: Error };

const CAPTURE_PADDING_PX = 24;

// Prevent iOS canvas clamp/downscale/blank on huge renders
const IOS_MAX_OUT_PX = 1700;
// Desktop/Android can handle larger
const DEFAULT_MAX_OUT_PX = 2600;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

function sanitizeFilename(name: string): string {
  const cleaned = (name ?? "").trim().replace(/[\/\\?%*:|"<>]/g, "-");
  return cleaned.length ? cleaned : "recipe";
}

function binaryDataToFile(binaryData: Blob, filename: string): File {
  return new File([binaryData], filename, { type: binaryData.type || "image/png" });
}

async function canvasToPngBinary(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBinary = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  if (!pngBinary) throw new Error("Failed to export canvas to PNG (toBlob returned null).");
  return pngBinary;
}

async function waitForFonts(): Promise<void> {
  try {
    // @ts-ignore
    if (document.fonts?.ready) {
      // @ts-ignore
      await document.fonts.ready;
    }
  } catch {}
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (!imgs.length) return;

  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((res) => {
        const done = () => res();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
}

async function nextPaint(): Promise<void> {
  await new Promise<void>((res) => requestAnimationFrame(() => res()));
  await new Promise<void>((res) => requestAnimationFrame(() => res()));
}

function computeScale(baseWidth: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const maxOut = isIOS() ? IOS_MAX_OUT_PX : DEFAULT_MAX_OUT_PX;

  // outputWidth ≈ baseWidth * scale
  const safe = Math.min(dpr, maxOut / Math.max(1, baseWidth));

  // Never below 1 (avoid blur), never above 2 (avoid huge canvases)
  return Math.max(1, Math.min(2, safe));
}

/**
 * Capture strategy:
 * - Clone element exactly as-is (no capture CSS overrides).
 * - Place clone in a paintable wrapper (NOT opacity:0), moved offscreen via transform.
 * - Wait for fonts/images/layout then html2canvas(wrapper).
 */
async function createPngBinaryFromElement(el: HTMLElement): Promise<Blob> {
  const rect = el.getBoundingClientRect();
  const baseWidth = Math.max(1, Math.ceil(rect.width));
  const scale = computeScale(baseWidth);

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.transform = "translateX(-20000px)"; // paintable offscreen
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = `${CAPTURE_PADDING_PX}px`;
  wrapper.style.boxSizing = "border-box";
  wrapper.style.zIndex = "2147483647";
  wrapper.style.width = `${baseWidth + CAPTURE_PADDING_PX * 2}px`;
  wrapper.style.overflow = "visible";

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${baseWidth}px`;
  clone.style.maxWidth = `${baseWidth}px`;
  clone.style.boxSizing = "border-box";
  clone.style.overflow = "visible";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  await waitForFonts();
  await waitForImages(wrapper);
  await nextPaint();

  try {
    const options: Html2CanvasOptionsCompat = {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: wrapper.scrollWidth,
      windowHeight: wrapper.scrollHeight,
    };

    const canvas = await html2canvas(wrapper, options as any);
    return await canvasToPngBinary(canvas);
  } finally {
    wrapper.remove();
  }
}

async function downloadBinary(binaryData: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(binaryData);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

async function copyImageToClipboard(pngBinary: Blob): Promise<boolean> {
  try {
    // iOS clipboard image writing is unreliable
    if (isIOS()) return false;

    const navAny = navigator as any;
    const ClipboardItemCtor = (window as any).ClipboardItem;
    if (!navAny.clipboard || !ClipboardItemCtor) return false;

    const item = new ClipboardItemCtor({ [pngBinary.type]: pngBinary });
    await navAny.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

function canNativeShareFiles(file: File): boolean {
  const navAny = navigator as any;
  if (!navAny?.share) return false;
  if (typeof navAny?.canShare !== "function") return false;
  try {
    return navAny.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * The key behavior difference:
 * - iOS: DO NOT attempt navigator.share after capture (often blocked). Always download.
 * - Others: try native share, then clipboard, then download.
 */
export async function shareOrCopyRecipeImage(
  pdfRef: RefObject<HTMLDivElement>,
  args: ShareRecipeArgs
): Promise<ShareResult> {
  try {
    const el = pdfRef.current;
    if (!el) throw new Error("shareOrCopyRecipeImage: pdfRef.current is null.");

    const safeName = sanitizeFilename(args.recipeName);
    const pngBinary = await createPngBinaryFromElement(el);
    const file = binaryDataToFile(pngBinary, `${safeName}.png`);

    // ✅ iPhone/iPad: reliable path (no NotAllowedError banners)
    if (isIOS()) {
      await downloadBinary(pngBinary, `${safeName}.png`);
      return { ok: true, method: "download", file };
    }

    // ✅ Non-iOS: best effort native share
    if (canNativeShareFiles(file)) {
      try {
        await (navigator as any).share({ files: [file], title: safeName });
        return { ok: true, method: "native-share", file };
      } catch (e: any) {
        // User cancelled share sheet -> treat as non-fatal (no toast)
        if (e?.name === "AbortError") {
          return { ok: false, error: new Error("Share cancelled.") };
        }
        // Fall back below
        console.warn("Native share failed, falling back:", e);
      }
    }

    // ✅ Clipboard convenience (desktop-ish)
    if (await copyImageToClipboard(pngBinary)) {
      return { ok: true, method: "clipboard", file };
    }

    // ✅ Final fallback: download
    await downloadBinary(pngBinary, `${safeName}.png`);
    return { ok: true, method: "download", file };
  } catch (e: any) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error: err };
  }
}

function isShareError(r: ShareResult): r is { ok: false; error: Error } {
  return r.ok === false;
}

export async function sharePdf(
  recipe: RecipeModel,
  pdfRef: RefObject<HTMLDivElement>,
  sharingRef: RefObject<boolean>
) {
  if (sharingRef.current) return;
  sharingRef.current = true;

  try {
    const result = await shareOrCopyRecipeImage(pdfRef, {
      recipeName: recipe.title ?? recipe.description ?? "recipe",
    });

    if (isShareError(result)) {
      // Don't toast for user cancel
      if (result.error.message !== "Share cancelled.") {
        notify.error(result.error.message ?? "Share failed");
      }
      return;
    }

    if (result.method === "clipboard") {
      notify.success("Copied image. Paste into WhatsApp.");
    } else if (result.method === "download") {
      notify.success("Saved image. Share it from Photos/Files.");
    }
  } finally {
    setTimeout(() => {
      sharingRef.current = false;
    }, 600);
  }
}
