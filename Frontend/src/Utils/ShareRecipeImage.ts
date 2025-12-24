import html2canvas from "html2canvas";
import { useRef, type RefObject } from "react";
import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "./Notify";

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

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

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

async function createPngBinaryFromElement(el: HTMLElement): Promise<Blob> {
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
  clone.classList.add("share-capture");
  clone.style.width = `${baseWidth}px`;
  clone.style.boxSizing = "border-box";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const options: Html2CanvasOptionsCompat = {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      useCORS: true,
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

async function openBinaryInNewTab(binaryDataOrFile: Blob): Promise<void> {
  const url = URL.createObjectURL(binaryDataOrFile);
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_URL_AFTER_MS);
  }
}

async function copyImageToClipboard(pngBinary: Blob): Promise<boolean> {
  try {
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
  return !!(
    navAny?.share &&
    typeof navAny?.canShare === "function" &&
    navAny.canShare({ files: [file] })
  );
}

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

    // ✅ iOS: skip native share-with-files (WebKit user-gesture restrictions)
    const ios = isIOS();
    if (!ios && canNativeShareFiles(file)) {
      await (navigator as any).share({ files: [file] });
      return { ok: true, method: "native-share", file };
    }

    // ✅ iOS fallback: open in new tab
    if (ios) {
      await openBinaryInNewTab(file);
      return { ok: true, method: "new-tab", file };
    }

    // keep existing behavior for non-iOS
    if (await copyImageToClipboard(pngBinary)) {
      return { ok: true, method: "clipboard", file };
    }

    if (isMobile()) {
      await openBinaryInNewTab(file);
      return { ok: true, method: "new-tab", file };
    }

    await downloadBinary(pngBinary, `${safeName}.png`);
    return { ok: true, method: "download", file };
  } catch (e: any) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error: err };
  }
}

export async function sharePdf(
   recipe: RecipeModel,
  pdfRef: RefObject<HTMLDivElement>,
  sharingRef: RefObject<boolean>
)
  {
  if (sharingRef.current) return;
  sharingRef.current = true;

  try {
    const result = await shareOrCopyRecipeImage(pdfRef, {
      recipeName: recipe.title ?? recipe.description ?? "recipe",
    });

    if (!result.ok) {
      const err =
        (result as any).error ??
        (result as any).message ??
        "Share failed (no error object returned)";
      console.error("Share failed:", result);
      notify.error(err);
      return;
    }

    if (result.method === "clipboard") {
      notify.success("Copied image. Paste into WhatsApp.");
    }
  } finally {
    setTimeout(() => {
      sharingRef.current = false;
    }, 600);
  }
}
