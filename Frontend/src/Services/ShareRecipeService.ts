import { RecipeModel } from "../Models/RecipeModel";
import { notify } from "../Utils/Notify";

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

async function fetchRecipePdfBlob(recipe: RecipeModel): Promise<Blob> {
  const hasId = Number(recipe?.id) > 0;
  const payload = {
    ...recipe,
    title: recipe?.title ?? "",
    data: recipe?.data ?? {
      ingredients: recipe?.data?.ingredients ??[],
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

export async function shareRecipeAsPdfWithToasts(recipe: any) {
  try {
    const safeName = sanitizeFilename(recipe?.title ?? "recipe");
    const pdf = await fetchRecipePdfBlob(recipe);
    const file = new File([pdf], `${safeName}.pdf`, { type: "application/pdf" });

    if (isIOS()) {
      await downloadBlob(pdf, `${safeName}.pdf`);
      notify.success("Saved PDF. Share it from Files / WhatsApp.");
      return;
    }

    if (canNativeShareFiles(file)) {
      try {
        await (navigator as any).share({
          files: [file],
          title: safeName,
        });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") {
          return;
        }
      }
    }

    await downloadBlob(pdf, `${safeName}.pdf`);
    notify.success("Saved PDF. Share it from Files / WhatsApp.");
  } catch (e: any) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.message !== "Share cancelled.") notify.error(err.message);
  }
}
