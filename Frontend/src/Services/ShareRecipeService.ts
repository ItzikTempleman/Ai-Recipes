import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "../Utils/Notify";

let __shareCallCounter = 0;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone/i.test(ua);
  const iPadOS = ua.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document;
  return iOS || iPadOS;
}

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIOS() || /Android/i.test(navigator.userAgent || "");
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

async function getTokenPdfUrl(recipe: RecipeModel): Promise<string> {
 const payload = {
  title: recipe?.title ?? "",
  data: {
    ingredients: recipe?.data?.ingredients ?? [],
    instructions: recipe?.data?.instructions ?? [],
  },
  image: recipe?.imageUrl ?? recipe?.image ?? "",
};

  const tokenResp = await fetch(`/api/recipes/share-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!tokenResp.ok) {
    throw new Error(await tokenResp.text());
  }

  const { token } = await tokenResp.json();
  const pdfPath = `/api/recipes/share.pdf?token=${encodeURIComponent(token)}`;

  return new URL(pdfPath, window.location.href).toString();
}

async function fetchPdfBlobFromUrl(pdfUrl: string): Promise<Blob> {
  const resp = await fetch(pdfUrl, { method: "GET" });
  if (!resp.ok) throw new Error(await resp.text());

  const blob = await resp.blob();
  if (!blob.type.includes("pdf")) throw new Error("Share response was not a PDF");
  return blob;
}

let sharingInFlight = false;

export async function shareRecipeAsPdfWithToasts(recipe: RecipeModel) {
  __shareCallCounter += 1;
  console.log("[SHARE] shareRecipeAsPdfWithToasts call #", __shareCallCounter, {
    time: new Date().toISOString(),
    recipeId: (recipe as any)?.id,
    title: (recipe as any)?.title,
    stack: new Error("share call stack").stack,
  });

  if (sharingInFlight) return;
  sharingInFlight = true;

  const releaseLater = () => setTimeout(() => (sharingInFlight = false), 1200);

  try {
    const safeName = sanitizeFilename((recipe as any)?.title ?? "recipe");
    const pdfUrl = await getTokenPdfUrl(recipe);

    // MOBILE: prefer sharing URL (more reliable than file share on iOS)
    if (isMobileUA()) {
      const navAny = navigator as any;

      if (typeof navAny?.share === "function") {
        try {
          await navAny.share({ title: safeName, url: pdfUrl });
          notify.success("Shared.");
          return;
        } catch (e: any) {
          // user canceled share → don't toast error
          if (e?.name === "AbortError") return;
          // else fall back to opening tab
        }
      }

      // Fallback: open PDF
      const opened = window.open("about:blank", "_blank");
      if (!opened) {
        window.location.href = pdfUrl;
      } else {
        opened.location.replace(pdfUrl);
      }
      notify.success("Opened PDF.");
      return;
    }

    // DESKTOP: try native file share, else download
    const pdfBlob = await fetchPdfBlobFromUrl(pdfUrl);
    const file = new File([pdfBlob], `${safeName}.pdf`, { type: "application/pdf" });

    if (canNativeShareFiles(file)) {
      await (navigator as any).share({ files: [file], title: safeName });
      notify.success("Shared.");
      return;
    }

    await downloadBlob(pdfBlob, `${safeName}.pdf`);
    notify.success("Downloaded PDF.");
  } catch (err: any) {
    notify.error(err?.message ?? "Failed to share recipe");
  } finally {
    releaseLater();
  }
}
