import axios from "axios";
import { RecipeModel } from "../Models/RecipeModel";
import { appConfig } from "../Utils/AppConfig";
import { notify } from "../Utils/Notify";

let __shareCallCounter = 0;
let sharingInFlight = false;

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
    description: (recipe as any)?.description ?? (recipe as any)?.data?.description ?? "",
    data: {
      ingredients: recipe?.data?.ingredients ?? [],
      instructions: recipe?.data?.instructions ?? [],
    },
    imageUrl: (recipe as any)?.imageUrl ?? (recipe as any)?.image ?? "",
    image: (recipe as any)?.imageUrl ?? (recipe as any)?.image ?? "",
    sugarRestriction: (recipe as any)?.sugarRestriction,
    lactoseRestrictions: (recipe as any)?.lactoseRestrictions,
    glutenRestrictions: (recipe as any)?.glutenRestrictions,
    dietaryRestrictions: (recipe as any)?.dietaryRestrictions,
    prepTime: (recipe as any)?.prepTime,
    difficultyLevel: (recipe as any)?.difficultyLevel,
    countryOfOrigin: (recipe as any)?.countryOfOrigin,
    healthLevel: (recipe as any)?.healthLevel,
    amountOfServings: (recipe as any)?.amountOfServings,
    calories: (recipe as any)?.calories,
    totalProtein: (recipe as any)?.totalProtein,
    totalSugar: (recipe as any)?.totalSugar,
  };

  const { data } = await axios.post<{ token: string }>(
    appConfig.shareTokenUrl,
    payload
  );
  return new URL(`${appConfig.sharePdfUrl}.pdf?token=${encodeURIComponent(data.token)}`, window.location.origin).toString();
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

function openPdfInNewTab(pdfUrl: string) {
  const opened = window.open("about:blank", "_blank");
  if (!opened) window.location.href = pdfUrl;
  else opened.location.replace(pdfUrl);
}

export async function shareRecipeAsPdfWithToasts(recipe: RecipeModel) {
  __shareCallCounter += 1;


  if (sharingInFlight) return;
  sharingInFlight = true;

  const releaseLater = () => setTimeout(() => (sharingInFlight = false), 1200);

  try {
    const safeName = sanitizeFilename((recipe as any)?.title ?? "recipe");
    const pdfUrl = await getTokenPdfUrl(recipe);
    const navAny = navigator as any;

    if (isMobileUA()) {

      if (isLocalhostUrl(pdfUrl)) {
        const pdfBlob = await fetchPdfBlobFromUrl(pdfUrl);
        const file = new File([pdfBlob], `${safeName}.pdf`, { type: "application/pdf" });
        if (canNativeShareFiles(file)) {
          await navAny.share({ files: [file], title: safeName });
          notify.success("Shared.");
          return;
        }

        await downloadBlob(pdfBlob, `${safeName}.pdf`);
        notify.success("Downloaded PDF.");
        return;
      }
      if (typeof navAny?.share === "function") {
        try {
          await navAny.share({ title: safeName, url: pdfUrl });
          notify.success("Shared.");
          return;
        } catch (e: any) {
          if (e?.name === "AbortError") return;

        }
      }
      openPdfInNewTab(pdfUrl);
      notify.success("Opened PDF.");
      return;
    }
    if (typeof navAny?.share === "function") {
      try {
        await navAny.share({ title: safeName, url: pdfUrl });
        notify.success("Shared.");
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;

      }
    }

    try {
      const pdfBlob = await fetchPdfBlobFromUrl(pdfUrl);
      const file = new File([pdfBlob], `${safeName}.pdf`, { type: "application/pdf" });
      if (canNativeShareFiles(file)) {
        await navAny.share({ files: [file], title: safeName });
        notify.success("Shared.");
        return;
      }

      await downloadBlob(pdfBlob, `${safeName}.pdf`);
      notify.success("Downloaded PDF.");
      return;
    } catch {

      openPdfInNewTab(pdfUrl);
      notify.success("Opened PDF.");
      return;
    }
  } catch (err: any) {
    notify.error(err?.message ?? "Failed to share recipe");
  } finally {
    releaseLater();
  }
}
