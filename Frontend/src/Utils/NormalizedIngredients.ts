import { IngredientLine } from "../Models/RecipeModel";

  
  
  export function normalizedIngredients(ingredients:IngredientLine[]){
    const out: typeof ingredients = [];
    const isModifierLine = (text: string) =>
      /^(finely|roughly|coarsely|thinly|freshly|cut|sliced|diced|minced|chopped|grated|shredded|cubed|peeled|crushed)\b/i.test(
        text.trim()
      );

    const appendToPrev = (suffix: string) => {
      if (out.length === 0) return;
      const prev = out[out.length - 1] as any;
      const prevText = String(prev.ingredient ?? "").trim();
      const add = suffix.trim();
      if (!add) return;

      const lastPart = prevText.split(",").pop()?.trim().toLowerCase();
      if (lastPart === add.toLowerCase()) return;

      const parts = prevText.split(",").map((p: string) => p.trim().toLowerCase());
      if (parts.includes(add.toLowerCase())) return;

      prev.ingredient = `${prevText}, ${add}`;
    };

    for (const line of ingredients) {
      const ingredientText = String((line as any)?.ingredient ?? "").trim();
      const rawAmount = (line as any)?.amount;
      const amountText = rawAmount === null || rawAmount === undefined ? "" : String(rawAmount).trim();

      if (!ingredientText) continue;
      if (!amountText && isModifierLine(ingredientText)) {
        appendToPrev(ingredientText);
        continue;
      }
      out.push(line);
    }
    return out;
  };



    export function normalizeIngredientRow(row: any) {
    const ingredient = String(row?.ingredient ?? "").trim();
    let amount = row?.amount == null ? "" : String(row.amount).trim();
    if (!ingredient || !amount) return { ingredient, amount };

    const escaped = ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    amount = amount.replace(re, "").replace(/\s{2,}/g, " ").trim();
    return { ingredient, amount };
  }