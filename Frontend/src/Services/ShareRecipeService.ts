import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "../Utils/Notify";


let __shareCallCounter = 0;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone/i.test(ua);
  const iPadOS = ua.includes("Macintosh") && "ontouchend" in document;
  return iOS || iPadOS;
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


async function fetchRecipePdfBlob(recipe: RecipeModel): Promise<Blob> {
  const hasId = Number(recipe?.id) > 0;
  const payload = {
    ...recipe,
    title: recipe?.title ?? "",
    data: recipe?.data ?? {
      ingredients: recipe?.data?.ingredients ?? [],
      instructions: recipe?.data?.instructions ?? [],
    },
    queryRestrictions: recipe?.queryRestrictions ?? [],
    imageUrl: recipe?.imageUrl ?? recipe?.image ?? "",
  };
  console.log("share payload", payload);
  const resp = hasId
    ? await fetch(`/api/recipes/${recipe.id}/share.pdf`)
    : await fetch(`/api/recipes/share.pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  if (!resp.ok) {
    throw new Error(await resp.text());
  }

  const blob = await resp.blob();
  if (!blob.type.includes("pdf")) {
    throw new Error("Share response was not a PDF");
  }
  return blob;
}

let sharingInFlight = false;


export async function shareRecipeAsPdfWithToasts(recipe: any) {
  __shareCallCounter += 1;
console.log("[SHARE] shareRecipeAsPdfWithToasts call #", __shareCallCounter, {
  time: new Date().toISOString(),
  recipeId: recipe?.id,
  title: recipe?.title,
  stack: new Error("share call stack").stack,
});

  if (sharingInFlight) return;
  sharingInFlight = true;

  const releaseLater = () => {
    // keep locked briefly to kill double-trigger / bubbling / double-tap
    setTimeout(() => {
      sharingInFlight = false;
    }, 1200);
  };

  try {
    const safeName = sanitizeFilename(recipe?.title ?? "recipe");
    const hasId = Number(recipe?.id) > 0;

    const isMobile = isIOS() || /Android/i.test(navigator.userAgent || "");

    // MOBILE: open PDF in viewer tab
// MOBILE: use native share sheet with URL (reliable), fallback to opening PDF tab
if (isMobile) {
  const safeName = sanitizeFilename(recipe?.title ?? "recipe");
  const hasId = Number(recipe?.id) > 0;

  let pdfPath = "";

  if (hasId) {
    pdfPath = `/api/recipes/${recipe.id}/share.pdf`;
  } else {
    // Guest: you already have share-token flow in your code, keep it.
    const payload = {
      ...recipe,
      title: recipe?.title ?? "",
      data: recipe?.data ?? {
        ingredients: recipe?.data?.ingredients ?? [],
        instructions: recipe?.data?.instructions ?? [],
      },
      queryRestrictions: recipe?.queryRestrictions ?? [],
      imageUrl: recipe?.imageUrl ?? recipe?.image ?? "",
    };

    const tokenResp = await fetch(`/api/recipes/share-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!tokenResp.ok) throw new Error(await tokenResp.text());
    const { token } = await tokenResp.json();

    pdfPath = `/api/recipes/share.pdf?token=${encodeURIComponent(token)}`;
  }

  // IMPORTANT: share expects an absolute URL on many mobile share sheets
  const pdfUrl = new URL(pdfPath, window.location.href).toString();

  const navAny = navigator as any;
  if (typeof navAny?.share === "function") {
    try {
      await navAny.share({ title: safeName, url: pdfUrl });
      notify.success("Shared.");
      return;
    } catch (e: any) {
      // user canceled share → don't show error toast
      if (e?.name === "AbortError") return;
      // fall through to open tab
    }
  }

  // Fallback: open PDF in viewer tab (old behavior)
  const opened = window.open("about:blank", "_blank");
  if (!opened) {
    window.location.href = pdfUrl;
    notify.success("Opened PDF.");
    return;
  }
  opened.location.replace(pdfUrl);
  notify.success("Opened PDF.");
  return;
}


    // DESKTOP: download/share file
    const pdf = await fetchRecipePdfBlob(recipe);
    const file = new File([pdf], `${safeName}.pdf`, { type: "application/pdf" });

    if (canNativeShareFiles(file)) {
      await (navigator as any).share({ files: [file], title: safeName });
      notify.success("Shared.");
      return;
    }

    await downloadBlob(pdf, `${safeName}.pdf`);
    notify.success("Downloaded PDF.");
  } catch (err: any) {
    notify.error(err?.message ?? "Failed to share recipe");
  } finally {
    releaseLater();
  }
}
