
export function normalizeLang(headerValue?: string | null): "en" | "he" {
    const v = (headerValue ?? "").trim().toLowerCase();
    if (v.startsWith("he")) return "he";
    if (v.includes("he")) return "he";
    return "en";
}

export function getIdeas(lang:string):string[]{

    const ideasEn = [
      "Popular real dinner recipe",
      "Popular real breakfast recipe",
      "Popular real lunch recipe",
      "Popular real vegetarian recipe",
      "Popular real chicken dish",
      "Popular real pasta dish",
      "Popular real salad recipe",
      "Popular real soup recipe",
      "Popular real Mediterranean dish",
      "Popular real Israeli dish",
      "Popular real Asian dish",
      "Popular real dessert recipe"
    ];

    const ideasHe = [
      "מתכון אמיתי ופופולרי לארוחת ערב",
      "מתכון אמיתי ופופולרי לארוחת בוקר",
      "מתכון אמיתי ופופולרי לארוחת צהריים",
      "מתכון צמחוני אמיתי ופופולרי",
      "מנה אמיתית ופופולרית עם עוף",
      "מנה אמיתית ופופולרית עם פסטה",
      "מתכון אמיתי ופופולרי לסלט",
      "מתכון אמיתי ופופולרי למרק",
      "מנה ים־תיכונית אמיתית ופופולרית",
      "מנה ישראלית אמיתית ופופולרית",
      "מנה אסייתית אמיתית ופופולרית",
      "מתכון אמיתי ופופולרי לקינוח"
    ];
     const ideas = lang === "he" ? ideasHe : ideasEn;
    return ideas;
}

