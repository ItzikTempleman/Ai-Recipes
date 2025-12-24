import html2pdf from "html2pdf.js";
import type { RefObject } from "react";
import { RecipeModel } from "../Models/RecipeModel";

let exporting = false;

function isLikelyMobile(): boolean {
  // crude but reliable enough for this UX
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function shareRecipePdf(
  pdfRef: RefObject<HTMLDivElement>,
  recipe: RecipeModel
): Promise<void> {
  const el = pdfRef.current;
  if (!el || !recipe) return;

  if (exporting) return;
  exporting = true;

  const rawTitle = (recipe.title ?? "").trim() || "recipe";
  const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, "-");
  const fileName = `${safeTitle}.pdf`;

  // stabilize width during capture
  const prevWidth = el.style.width;
  const prevMaxWidth = el.style.maxWidth;

  document.body.classList.add("pdf-exporting");

  try {
    el.style.width = "800px";
    el.style.maxWidth = "800px";

    // wait for fonts (helps but not perfect)
    await (document as any).fonts?.ready;

    const options = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    } as any;

    const worker = html2pdf().set(options).from(el);
    const blob: Blob = await worker.outputPdf("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });

    const nav: any = navigator;
    const canFileShare = !!(nav.share && nav.canShare?.({ files: [file] }));

    // Mobile: try real file share (WhatsApp often appears)
    if (canFileShare && isLikelyMobile()) {
      await nav.share({ files: [file], title: rawTitle, text: rawTitle });
      return;
    }

    // Desktop (and non-support): download + open WhatsApp Web with instructions
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `I exported "${fileName}". Please attach the downloaded PDF.`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  } finally {
    el.style.width = prevWidth;
    el.style.maxWidth = prevMaxWidth;
    document.body.classList.remove("pdf-exporting");
    exporting = false;
  }
}
