import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "../Utils/Notify";



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

    // ShareRenderPage uses imageUrl in your backend code comments
    imageUrl: (recipe as any)?.imageUrl ?? (recipe as any)?.image ?? "",
    image: (recipe as any)?.imageUrl ?? (recipe as any)?.image ?? "",

    // badges / filters (these exist in backend’s "minimal" already)
    sugarRestriction: (recipe as any)?.sugarRestriction,
    lactoseRestrictions: (recipe as any)?.lactoseRestrictions,
    glutenRestrictions: (recipe as any)?.glutenRestrictions,
    dietaryRestrictions: (recipe as any)?.dietaryRestrictions,

    // meta
    prepTime: (recipe as any)?.prepTime,               // cook time
    difficultyLevel: (recipe as any)?.difficultyLevel, // hardship level
    countryOfOrigin: (recipe as any)?.countryOfOrigin, // country name (flag comes from UI logic)
    healthLevel: (recipe as any)?.healthLevel,

    // nutrition
    calories: (recipe as any)?.calories,
    totalProtein: (recipe as any)?.totalProtein,
    totalSugar: (recipe as any)?.totalSugar,
  };

  const tokenResp = await fetch(`/api/recipes/share-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!tokenResp.ok) throw new Error(await tokenResp.text());

  const { token } = await tokenResp.json();

  const pdfPath = `/api/recipes/share.pdf?token=${encodeURIComponent(token)}`;

  // IMPORTANT: your current code uses window.location.href (can include SPA route/query)
  // use origin so the URL is clean and consistent
  return new URL(pdfPath, window.location.origin).toString();
}

async function fetchPdfBlobFromUrl(pdfUrl: string): Promise<Blob> {
  const resp = await fetch(pdfUrl, { method: "GET" });
  if (!resp.ok) throw new Error(await resp.text());

  const blob = await resp.blob();
  if (!blob.type.includes("pdf")) throw new Error("Share response was not a PDF");
  return blob;
}


function isLocalhostUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export async function shareRecipeAsPdfWithToasts(recipe: RecipeModel) {
  // ...keep your existing code up to:
  const safeName = sanitizeFilename((recipe as any)?.title ?? "recipe");
  const pdfUrl = await getTokenPdfUrl(recipe);

  // MOBILE
  if (isMobileUA()) {
    const navAny = navigator as any;

    // ✅ FIX #4: if it's localhost, share a FILE instead of an unreachable URL
    if (isLocalhostUrl(pdfUrl)) {
      const pdfBlob = await fetchPdfBlobFromUrl(pdfUrl);
      const file = new File([pdfBlob], `${safeName}.pdf`, { type: "application/pdf" });

      if (typeof navAny?.share === "function" && canNativeShareFiles(file)) {
        await navAny.share({ files: [file], title: safeName });
        notify.success("Shared.");
        return;
      }

      // fallback if native file share not supported
      await downloadBlob(pdfBlob, `${safeName}.pdf`);
      notify.success("Downloaded PDF.");
      return;
    }

    // existing behavior (share URL) for real domains like https://www.itzikrecipe.com
    if (typeof navAny?.share === "function") {
      try {
        await navAny.share({ title: safeName, url: pdfUrl });
        notify.success("Shared.");
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }

    // existing fallback open tab
    const opened = window.open("about:blank", "_blank");
    if (!opened) window.location.href = pdfUrl;
    else opened.location.replace(pdfUrl);
    notify.success("Opened PDF.");
    return;
  }
}