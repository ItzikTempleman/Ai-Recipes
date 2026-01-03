export function isLethalQuery(rawString: string): boolean {
  const query = rawString.toLowerCase();

  // 1) Clearly lethal / poison-related terms (non-alcohol)
  const lethalKeyWords = [
    "poison",
    "poisonous",
    "lethal",
    "kill",
    "murder",
    "toxic",
    "cyanide",
    "rat poison",
    "bleach",
    "detergent",
    "antifreeze",
    "ethylene glycol",
    "drain cleaner",
    "draino",
    "acetone",
    "אציטון",  // Hebrew transliteration with י
    "אצטון",  // Hebrew transliteration without י (other common spelling)
    "רעל",
    "להרוג",
  ];

  if (lethalKeyWords.some((word) => query.includes(word))) {
    return true;
  }

  // 2) Non-drinking alcohols / typical lethal-use alcohol terms
  const lethalAlcoholKeyWords = [
    "isopropyl alcohol",
    "rubbing alcohol",
    "wood alcohol",
    "methanol",
    "denatured alcohol",
    "industrial alcohol",
    "cleaning alcohol",
    "alcohol for cleaning",
    "חומר חיטוי",
    "אלכוהול לחיטוי",
    "אלכוהול לניקוי",
  ];

  if (lethalAlcoholKeyWords.some((word) => query.includes(word))) {
    return true;
  }

  // 3) High-percentage alcohol patterns like "alcohol 70%" (likely not a drink)
  const percentPattern = /\b(alcohol|אלכוהול)\s*(\d{2,3})\s*%/i;
  const percentMatch = rawString.match(percentPattern);
  if (percentMatch) {
    const pct = parseInt(percentMatch[2], 10);
    if (!Number.isNaN(pct) && pct >= 60) {
      return true;
    }
  }

  // 4) Generic "alcohol" presence
  const genericAlcoholWords = ["alcohol", "אלכוהול", "אתנול"];
  const mentionsGenericAlcohol = genericAlcoholWords.some((word) =>
    query.includes(word)
  );

  // 5) Obvious food/drink context that makes it "normal drinking alcohol"
  const foodOrDrinkContextWords = [
    "wine",
    "beer",
    "vodka",
    "whiskey",
    "rum",
    "gin",
    "tequila",
    "liqueur",
    "cocktail",
    "drink",
    "shot",
    "spritz",
    "sauce",
    "marinade",
    "cake",
    "dessert",
    "pasta",
    "stew",
    "soup",
    "chicken",
    "beef",
    "fish",
    "משקה",
    "קוקטייל",
    "רטב",
    "רוטב",
    "עוגה",
    "קינוח",
    "פסטה",
    "מרינדה",
  ];
  const hasFoodOrDrinkContext = foodOrDrinkContextWords.some((word) =>
    query.includes(word)
  );

  // 6) Generic alcohol + lethal intent together → always block
  const intentWords = [
    "poison",
    "poisonous",
    "kill",
    "lethal",
    "toxic",
    "רעל",
    "להרוג",
  ];
  const mentionsLethalIntent = intentWords.some((word) =>
    query.includes(word)
  );

  if (mentionsGenericAlcohol && mentionsLethalIntent) {
    return true;
  }

  // 7) Generic alcohol with NO clear food/drink context → treat as dangerous
  if (mentionsGenericAlcohol && !hasFoodOrDrinkContext) {
    return true;
  }

  // If none of the lethal patterns matched, allow it.
  return false;
}