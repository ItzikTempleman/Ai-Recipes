import { notify } from "../Utils/Notify";

export type SharePdfResult =
  | { ok: true; method: "native-share" | "download"; file: File }
  | { ok: false; error: Error };

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

function sanitizeFilename(name: string): string {
  const cleaned = (name ?? "").trim().replace(/[\/\\?%*:|"<>]/g, "-");
  return cleaned.length ? cleaned : "recipe";
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

async function downloadBlob(blob: Blob, filename: string) {
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

async function fetchSharePdf(recipeId: number): Promise<Blob> {
  const resp = await fetch(`/api/recipes/${recipeId}/share.pdf`, {
    method: "GET",
    credentials: "include",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Share PDF failed: ${resp.status} ${resp.statusText} ${text}`.trim());
  }

  const blob = await resp.blob();
  if (!blob.type.includes("pdf")) {
    throw new Error("Share response was not a PDF");
  }
  return blob;
}

export async function shareRecipeAsPdf(
  recipeId: number,
  recipeName: string
): Promise<SharePdfResult> {
  try {
    const safeName = sanitizeFilename(recipeName);
    const pdf = await fetchSharePdf(recipeId);
    const file = new File([pdf], `${safeName}.pdf`, { type: "application/pdf" });

    // iOS: download is most reliable
    if (isIOS()) {
      await downloadBlob(pdf, `${safeName}.pdf`);
      return { ok: true, method: "download", file };
    }

    // Android / desktop
    if (canNativeShareFiles(file)) {
      try {
        await (navigator as any).share({
          files: [file],
          title: safeName,
        });
        return { ok: true, method: "native-share", file };
      } catch (e: any) {
        if (e?.name === "AbortError") {
          return { ok: false, error: new Error("Share cancelled.") };
        }
      }
    }

    await downloadBlob(pdf, `${safeName}.pdf`);
    return { ok: true, method: "download", file };
  } catch (e: any) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

function isShareError(
  r: SharePdfResult
): r is { ok: false; error: Error } {
  return r.ok === false;
}

export async function shareRecipeAsPdfWithToasts(
  recipeId: number,
  recipeName: string
) {
  const result = await shareRecipeAsPdf(recipeId, recipeName);

  if (isShareError(result)) {
    if (result.error.message !== "Share cancelled.") {
      notify.error(result.error.message);
    }
    return;
  }

  if (result.method === "download") {
    notify.success("Saved PDF. Share it from Files / WhatsApp.");
  }
}
