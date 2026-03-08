function looksHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

export function naturalizeRecipeTitle(rawTitle: unknown): string {
  const title = String(rawTitle ?? "").trim().replace(/\s+/g, " ");
  if (!title) return "";

  if (looksHebrew(title)) {
    if (
      /(?:לבה.*שוקולד|שוקולד.*לבה|עוגת לבה|עוגת שוקולד בספל|סופלה שוקולד)/.test(title)
    ) {
      return "סופלה שוקולד";
    }

    if (/עוגיות עם שוקולד צ'יפס/.test(title)) {
      return "עוגיות שוקולד צ'יפס";
    }

    return title;
  }

  const lower = title.toLowerCase();

  if (
    lower === "lava chocolate cake" ||
    lower === "chocolate lava cake" ||
    lower === "molten chocolate cake"
  ) {
    return "Chocolate Lava Cake";
  }

  if (lower === "chocolate chip cookies") {
    return "Chocolate Chip Cookies";
  }

  return title;
}