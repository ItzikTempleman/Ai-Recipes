import html2canvas from "html2canvas";
import type { RefObject } from "react";
import { RecipeModel } from "../Models/RecipeModel";

let exporting = false;

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function safeName(title: string): string {
  const raw = (title ?? "").trim() || "recipe";
  return raw.replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function shareRecipeAsImage(
  ref: RefObject<HTMLDivElement>,
  recipe: RecipeModel
): Promise<void> {
  const el = ref.current;
  if (!el || !recipe) return;
  if (exporting) return;
  exporting = true;

  // IMPORTANT: enable the CSS overrides BEFORE any await
  document.documentElement.classList.add("share-capture");

  try {
    await (document as any).fonts?.ready;
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const fullW = el.scrollWidth;
    const fullH = el.scrollHeight;

    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(3, Math.max(2, dpr * 2));

    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,

      // Capture full element size (not viewport)
      width: fullW,
      height: fullH,
      windowWidth: fullW,
      windowHeight: fullH,

      scrollX: 0,
      scrollY: 0,
    });

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 1)
    );
    if (!blob) return;

    const title = (recipe.title ?? "").trim() || "Recipe";
    const fileName = `${safeName(title)}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    const nav: any = navigator;
    const canShareFiles = !!(nav.share && nav.canShare?.({ files: [file] }));

    if (isMobile() && canShareFiles) {
      await nav.share({ files: [file], title, text: title });
      return;
    }

    // iOS fallback: open image in a new tab, user uses native share button
    if (isMobile() && !canShareFiles) {
      openBlobInNewTab(blob);
      return;
    }

    // Desktop fallback
    downloadBlob(blob, fileName);
  } finally {
    document.documentElement.classList.remove("share-capture");
    exporting = false;
  }
}
