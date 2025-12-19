import { InputModel } from "../3-models/InputModel";
import { GPTImage, openaiImages } from "../3-models/recipe-model";
import fs from "fs/promises";
import path from "path";
import { appConfig } from "../2-utils/app-config";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions } from "../3-models/filters";

export async function generateImage(recipe: any): Promise<GPTImage> {
  const lowerQuery = String(recipe.query ?? "").toLowerCase();
  const extraBanned: string[] = [];
  const promptParts: string[] = [`High resolution, super-realistic food photo of ${recipe.query}`,`Show only the finished dish. No text, no logos, no extra food.
- Do NOT add side dishes (rice, bread, salad) unless explicitly part of the recipe OR listed in ALLOWED INGREDIENTS.
- Only show ingredients that appear in the recipe (see ALLOWED INGREDIENTS).
- Do NOT add herbs, garnish, or extra colors unless explicitly listed in ALLOWED INGREDIENTS.
- Realistic home-cooked style, not styled food photography.`];
  if (recipe.ingredients?.length) {
    const allowed = recipe.ingredients
      .map((x: any) => String(x?.ingredient ?? "").trim())
      .filter(Boolean)
      .slice(0, 40)
      .join(", ");
    promptParts.push(`ALLOWED INGREDIENTS (ONLY these may appear): ${allowed}.`);
  }
  if (recipe.dietaryRestrictions === DietaryRestrictions.VEGAN) {
    promptParts.push(
      "The dish must be 100% vegan with no animal products at all (no meat, fish, eggs, dairy, butter, gelatin, or honey)."
    );
  }
  if (recipe.dietaryRestrictions === DietaryRestrictions.KOSHER) {
    promptParts.push(
      "The dish must be strictly kosher style: no pork and no shellfish.",
      "Do not mix meat and dairy together anywhere in the image.",
      "If there is visible meat, absolutely do not show any cheese, butter, cream, or other dairy near it.",
      "Never include anything from the excluded/forbidden ingredients list."
    );
    extraBanned.push("pepperoni", "bacon", "ham", "salami", "sausage", "shrimp", "lobster", "crab");
    if (extraBanned.length) {
      promptParts.push(
        `Do not show any of the following ingredients anywhere in the image: ${extraBanned.join(", ")}.`
      );
    }
  }
  if (recipe.dietaryRestrictions === DietaryRestrictions.HALAL) {
    promptParts.push(
      "The dish must be halal: no pork or pork derivatives and no alcohol."
    );
  }
  if (recipe.lactoseRestrictions === LactoseRestrictions.NONE) {
    promptParts.push(
      "The dish must be completely lactose-free: no visible cheese, milk, cream, butter, or other dairy ingredients."
    );
  }
  if (recipe.glutenRestrictions === GlutenRestrictions.NONE) {
    promptParts.push(
      "The dish must be gluten-free: do not show bread, regular pasta, or obvious wheat flour products; use visually plausible gluten-free alternatives instead."
    );
  }
  if (recipe.queryRestrictions?.length) {
    const excluded = (recipe.queryRestrictions ?? []).map((x: any) => String(x).trim()).filter(Boolean);
    if (excluded.length) {
      promptParts.push(
        `Do not show any of the following ingredients anywhere in the image: ${excluded.join(", ")}.`
      );
    }
  }
  const ingredientNames = (recipe as any).ingredients?.map((x: any) => String(x.ingredient ?? "").trim()).filter(Boolean).slice(0, 25) ?? [];
  const methodHint = (recipe as any).instructions?.slice(0, 3).join(" ").replace(/\s+/g, " ").slice(0, 500) ?? "";
  if (ingredientNames.length) {
    promptParts.push(`Recipe facts (must match): Ingredients: ${ingredientNames.join(", ")}.`);
  }
  if (methodHint) {
    promptParts.push(`Method cues (must match): ${methodHint}.`);
  }
  let lastErr: any;
  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptPromptParts = [...promptParts];
    if (attempt === 1) {
      attemptPromptParts.push(
        "CRITICAL: The image is invalid if it contains any excluded ingredient.",
        "CRITICAL: The image is invalid if it contains any ingredient not listed in ALLOWED INGREDIENTS.",
      );
    }
    const promptText = attemptPromptParts.join(" ");
    try {
      const result = await openaiImages.images.generate({
        model: "gpt-image-1.5",
        prompt: promptText,
        size: "1024x1024"
      });
      if (!result.data?.[0]?.b64_json) throw new Error("No image generated");
      const imageBase64 = result.data[0].b64_json;
      const imagesDir =
        process.env.IMAGE_DIR || path.join(__dirname, "..", "1-assets", "images");
      await fs.mkdir(imagesDir, { recursive: true });
      const safeTitle = String(recipe.query ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = `${safeTitle}-recipe.png`;
      await fs.writeFile(
        path.join(imagesDir, fileName),
        Buffer.from(imageBase64, "base64")
      );
      const url = new URL(encodeURIComponent(fileName), appConfig.baseImageUrl).toString();
      return { fileName, url };
    } catch (err: any) {
      console.error("OpenAI IMAGE:", err?.response?.data);
      lastErr = err;
      if (err?.response?.status === 429) {
        const retryAfter = Number(err?.response?.headers?.["retry-after"]) || 1500;
        await new Promise((r) => setTimeout(r, retryAfter));
        continue;
      }
      if (attempt === 0) continue;
      throw err;
    }
  }
  throw lastErr;
}