
export function normalizeLang(headerValue?: string | null): "en" | "he" {
    const v = (headerValue ?? "").trim().toLowerCase();
    if (v.startsWith("he")) return "he";
    if (v.includes("he")) return "he";
    return "en";
}