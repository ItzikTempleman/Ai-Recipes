import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "../Utils/Notify";

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
    if (sharingInFlight) return;
  sharingInFlight = true;
  try {
    const safeName = sanitizeFilename(recipe?.title ?? "recipe");
    const hasId = Number(recipe?.id) > 0;

    // MOBILE (iOS + Android): open PDF in a new tab (native viewer/share works)
    const isMobile = isIOS() || /Android/i.test(navigator.userAgent);

    if (isMobile) {
      if (hasId) {
        window.open(`/api/recipes/${recipe.id}/share.pdf`, "_blank");
        return;
      }

      // Guest: mint token then open GET PDF
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

      window.open(`/api/recipes/share.pdf?token=${encodeURIComponent(token)}`, "_blank");
      return;
    }

    // DESKTOP: keep existing file-share / download behavior
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
  }finally {
    sharingInFlight = false;
  }
}
