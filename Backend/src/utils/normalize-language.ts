export function normalizeLang(headerValue?: string | null): "en" | "he" {
  const v = (headerValue ?? "").trim().toLowerCase();
  if (v.startsWith("he")) return "he";
  if (v.includes("he")) return "he";
  return "en";
}

export function getIdeas(lang: string): string[] {
  const ideasEn = [
    "Popular real breakfast recipe",
    "Popular real lunch recipe",
    "Popular real dinner recipe",
    "Popular real vegetarian recipe",
    "Popular real pasta dish",
    "Popular real salad recipe",
    "Popular real soup recipe",
    "Popular real Mediterranean dish",
    "Popular real Israeli dish",
    "Popular real Asian dish",

    "Popular real dessert recipe",
    "Popular real baked dessert recipe",
    "Popular real chocolate dessert recipe",
    "Popular real fruit dessert recipe",
    "Popular real dairy dessert recipe",

    "Popular real fish recipe",
    "Popular real baked fish recipe",
    "Popular real grilled fish recipe",
    "Popular real salmon recipe",
    "Popular real tuna recipe",

    "Popular real dairy recipe",
    "Popular real cheese-based recipe",
    "Popular real yogurt-based recipe",
    "Popular real creamy dairy pasta recipe",
    "Popular real dairy breakfast recipe"
  ];

  const ideasHe = [
    "מתכון אמיתי ופופולרי לארוחת בוקר",
    "מתכון אמיתי ופופולרי לארוחת צהריים",
    "מתכון אמיתי ופופולרי לארוחת ערב",
    "מתכון צמחוני אמיתי ופופולרי",
    "מנה אמיתית ופופולרית עם פסטה",
    "מתכון אמיתי ופופולרי לסלט",
    "מתכון אמיתי ופופולרי למרק",
    "מנה ים־תיכונית אמיתית ופופולרית",
    "מנה ישראלית אמיתית ופופולרית",
    "מנה אסייתית אמיתית ופופולרית",

    "מתכון אמיתי ופופולרי לקינוח",
    "מתכון אמיתי ופופולרי לקינוח אפוי",
    "מתכון אמיתי ופופולרי לקינוח שוקולד",
    "מתכון אמיתי ופופולרי לקינוח פירות",
    "מתכון אמיתי ופופולרי לקינוח חלבי",

    "מתכון אמיתי ופופולרי לדג",
    "מתכון אמיתי ופופולרי לדג אפוי",
    "מתכון אמיתי ופופולרי לדג על הגריל",
    "מתכון אמיתי ופופולרי עם סלמון",
    "מתכון אמיתי ופופולרי עם טונה",

    "מתכון חלבי אמיתי ופופולרי",
    "מתכון אמיתי ופופולרי על בסיס גבינות",
    "מתכון אמיתי ופופולרי על בסיס יוגורט",
    "מתכון אמיתי ופופולרי לפסטה חלבית",
    "מתכון אמיתי ופופולרי לארוחת בוקר חלבית"
  ];

  return lang === "he" ? ideasHe : ideasEn;
}
