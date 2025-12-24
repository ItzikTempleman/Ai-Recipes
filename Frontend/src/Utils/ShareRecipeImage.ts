// Frontend/src/Utils/ShareRecipeImage.ts
import html2canvas from "html2canvas";
import type React from "react";


export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

type ShareRecipeArgs = {
  recipeName: string;
};

export type ShareResult =
  | {
      ok: true;
      method: "native-share" | "clipboard" | "new-tab" | "download";
      file: File;
    }
  | { ok: false; error: Error };

const CAPTURE_SCALE = 2;
const CAPTURE_PADDING_PX = 24;
const REVOKE_URL_AFTER_MS = 15000;

function sanitizeFilename(name: string): string {
  const cleaned = (name ?? "").trim().replace(/[\/\\?%*:|"<>]/g, "-");
  return cleaned.length ? cleaned : "recipe";
}

function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || "image/png" });
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  if (!blob) throw new Error("Failed to export canvas to PNG (toBlob returned null).");
  return blob;
}

/**
 * Creates a PNG capture of `el` in a way that avoids common html2canvas edge-cropping:
 * - clones into an offscreen wrapper
 * - adds padding around the cloned content
 * - forces a capture-safe CSS mode via `.share-capture`
 */
async function createPngFromElement(el: HTMLElement): Promise<Blob> {
  const rect = el.getBoundingClientRect();
  const baseWidth = Math.max(1, Math.ceil(rect.width));

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = `${CAPTURE_PADDING_PX}px`;
  wrapper.style.boxSizing = "border-box";
  wrapper.style.zIndex = "2147483647";
  wrapper.style.width = `${baseWidth + CAPTURE_PADDING_PX * 2}px`;

  const clone = el.cloneNode(true) as HTMLElement;
  // Your CSS should define .share-capture overrides to disable wide/overflow layouts
  clone.classList.add("share-capture");
  clone.style.width = `${baseWidth}px`;
  clone.style.boxSizing = "border-box";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: wrapper.scrollWidth,
      windowHeight: wrapper.scrollHeight,
    });

    return await canvasToPngBlob(canvas);
  } finally {
    wrapper.remove();
  }
}

async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
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

async function openBlobInNewTab(blobOrFile: Blob): Promise<void> {
  const url = URL.createObjectURL(blobOrFile);
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_URL_AFTER_MS);
  }
}

/**
 * Attempts to copy an image blob to the clipboard.
 * Works on secure contexts (https/localhost) and when the browser supports ClipboardItem.
 */
async function copyImageToClipboard(pngBlob: Blob): Promise<boolean> {
  try {
    const navAny = navigator as any;
    const ClipboardItemCtor = (window as any).ClipboardItem;
    if (!navAny.clipboard || !ClipboardItemCtor) return false;

    const item = new ClipboardItemCtor({ [pngBlob.type]: pngBlob });
    await navAny.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

function canNativeShareFiles(file: File): boolean {
  const navAny = navigator as any;
  return !!(
    navAny?.share &&
    typeof navAny?.canShare === "function" &&
    navAny.canShare({ files: [file] })
  );
}

/**
 * Export/share flow:
 * 1) Capture PNG (reliable, not cropped)
 * 2) If Web Share API supports files -> native share (WhatsApp can appear here)
 * 3) Else try clipboard copy (best for WhatsApp Web / pasting anywhere)
 * 4) Else on mobile open new tab (user shares/saves from there)
 * 5) Else download
 */
export async function shareOrCopyRecipeImage(
  pdfRef: React.RefObject<HTMLDivElement>,
  args: ShareRecipeArgs
): Promise<ShareResult> {
  try {
    const el = pdfRef.current;
    if (!el) throw new Error("shareOrCopyRecipeImage: pdfRef.current is null.");

    const safeName = sanitizeFilename(args.recipeName);
    const pngBlob = await createPngFromElement(el);
    const file = blobToFile(pngBlob, `${safeName}.png`);

    // 1) Native share sheet (WhatsApp appears here IF supported/installed)
    if (canNativeShareFiles(file)) {
      const navAny = navigator as any;
await navAny.share({
  files: [file],
  // DO NOT set title/text — WhatsApp may show it as a caption/path
});
      return { ok: true, method: "native-share", file };
    }

    // 2) Clipboard fallback (best for desktop / WhatsApp Web)
    const copied = await copyImageToClipboard(pngBlob);
    if (copied) {
      return { ok: true, method: "clipboard", file };
    }

    // 3) Mobile fallback: open new tab so user can share/save from browser UI
    if (isMobile()) {
      await openBlobInNewTab(file);
      return { ok: true, method: "new-tab", file };
    }

    // 4) Desktop fallback: download
    await downloadBlob(pngBlob, `${safeName}.png`);
    return { ok: true, method: "download", file };
  } catch (e: any) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error: err };
  }
}
