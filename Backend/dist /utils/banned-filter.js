"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLethalQuery = isLethalQuery;
function isLethalQuery(rawString) {
    const query = rawString.toLowerCase();
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
        "אציטון",
        "אצטון",
        "רעל",
        "להרוג",
    ];
    if (lethalKeyWords.some((word) => query.includes(word))) {
        return true;
    }
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
    const percentPattern = /\b(alcohol|אלכוהול)\s*(\d{2,3})\s*%/i;
    const percentMatch = rawString.match(percentPattern);
    if (percentMatch) {
        const pct = parseInt(percentMatch[2], 10);
        if (!Number.isNaN(pct) && pct >= 60) {
            return true;
        }
    }
    const genericAlcoholWords = ["alcohol", "אלכוהול", "אתנול"];
    const mentionsGenericAlcohol = genericAlcoholWords.some((word) => query.includes(word));
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
    const hasFoodOrDrinkContext = foodOrDrinkContextWords.some((word) => query.includes(word));
    const intentWords = [
        "poison",
        "poisonous",
        "kill",
        "lethal",
        "toxic",
        "רעל",
        "להרוג",
    ];
    const mentionsLethalIntent = intentWords.some((word) => query.includes(word));
    if (mentionsGenericAlcohol && mentionsLethalIntent) {
        return true;
    }
    if (mentionsGenericAlcohol && !hasFoodOrDrinkContext) {
        return true;
    }
    return false;
}
