import { GPTImage, openaiImages, RecipeCategory } from "../models/recipe-model";
import fs from "fs/promises";
import path from "path";
import { appConfig } from "../utils/app-config";
import { DietaryRestrictions } from "../models/filters";
import crypto from "crypto";

export async function generateImage(recipe: any): Promise<GPTImage> {
  const lowerQuery = String(recipe.query ?? "").toLowerCase();
  const title = String(recipe?.title ?? "").trim();
  const query = String(recipe?.query ?? "").trim();

  const ingredientNames =
    (recipe?.ingredients ?? [])
      .map((x: any) => String(x?.ingredient ?? "").trim())
      .filter(Boolean);

  const allowed = ingredientNames.slice(0, 40).join(", ");

  const methodHint =
    (recipe?.instructions ?? [])
      .slice(0, 4)
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 700);

  const categories: RecipeCategory[] =
    Array.isArray(recipe?.categories)
      ? recipe.categories.map((x: any) => String(x).trim()).filter(Boolean)
      : [];

  const cleanQueryRestrictions =
    Array.isArray(recipe?.queryRestrictions)
      ? recipe.queryRestrictions
          .map((x: any) => String(x ?? "").trim())
          .filter((x: string) => x && !x.startsWith("__CONTENT_HASH__:"))
      : [];

  const promptParts: string[] = [
    `fhd quality realistic food photo of the finished cooked dish for this recipe.`,
    `Dish label (do not render text): "${title || query}".`,
    `SOURCE OF TRUTH (CRITICAL):
- The image must follow ALL of these together: DISH LABEL, ALLOWED INGREDIENTS, METHOD CUES, CATEGORY TAGS, and RESTRICTION FLAGS.
- If the title suggests a famous default dish but the categories / ingredients / kosher rules say otherwise, the categories / ingredients / kosher rules win.
- CATEGORY TAGS: ${categories.length ? categories.join(", ") : "none"}.`,
    `RENDER SPEC (CRITICAL):
- Render the dish to match the RECIPE composition, not a generic default or a guessed reference dish.
- The dish must visually align with the dish label AND the ingredient list AND the method cues AND the category tags.
- If the dish label is a globally known dish name, you must still obey the recipe constraints instead of falling back to the common non-kosher version.`,
    `COMPOSITION & VISIBILITY (CRITICAL):
- Show only the finished dish on a simple plate/tray/pan. No hands, no utensils in motion, no extra props.
- Do NOT add side dishes unless explicitly part of the recipe OR listed in ALLOWED INGREDIENTS.
- Do NOT add garnish, herbs, toppings, or decorative elements unless they are explicitly in ALLOWED INGREDIENTS.
- Every primary ingredient that would be visible in the finished dish MUST be visible in a realistic cooked form.`,
    `INGREDIENT DISCIPLINE (CRITICAL):
- ONLY show ingredients that appear in ALLOWED INGREDIENTS as identifiable ingredients/toppings.
- Do NOT invent extra toppings, garnishes, herbs, decorative elements, or canonical extras from a famous version of the dish.
- If something is not listed in ALLOWED INGREDIENTS, it must NOT appear in the image.`,
    `TECHNIQUE FIDELITY (CRITICAL):
- The visuals must match the cooking method cues (baked vs fried vs simmered/poached vs grilled).
- If the method implies simmering/braising/poaching in liquid: surfaces should look tender and liquid-coated, with minimal crust.
- If the method implies frying/searing/grilling: show crisp browning/char appropriately.`,
    `APPETIZING REALISM (CRITICAL):
- Make it look freshly cooked and appetizing (not dry, not stale, not dusty, not chalky, not matte).
- Use natural kitchen/restaurant lighting.
- Avoid AI-clean perfection; include believable textures.`,
    `ALLOWED INGREDIENTS (ONLY these may appear as identifiable ingredients/toppings): ${allowed}.`,
    `METHOD CUES (must match the look): ${methodHint}`,
    `QUALITY GUARDS:
- No snow-like curds, cottony clumps, plastic shine, waxy surfaces, or powdery/dusty look.
- No perfect symmetry or identical repeated shapes.`
  ];

  if (categories.includes(RecipeCategory.dairy)) {
    promptParts.push(
      "This is a DAIRY dish.",
      "Do not show beef, chicken, turkey, lamb, shawarma, burger patties, meat sauce, meat broth, bacon, ham, pepperoni, salami, or sausage anywhere in the image.",
      "Fish is allowed only if fish is actually present in ALLOWED INGREDIENTS or the recipe is also categorized as fish."
    );
  }

  if (categories.includes(RecipeCategory.meat)) {
    promptParts.push(
      "This is a MEAT dish.",
      "Do not show cheese, cream, butter, yogurt, or other dairy visuals anywhere in the image."
    );
  }

  if (categories.includes(RecipeCategory.fish)) {
    promptParts.push(
      "This is a FISH dish.",
      "Show fish only if fish is present in ALLOWED INGREDIENTS.",
      "Do not substitute fish with chicken, beef, lamb, bacon, ham, pepperoni, sausage, or other meat."
    );
  }

  if (recipe.dietaryRestrictions === DietaryRestrictions.VEGAN) {
    promptParts.push(
      "The dish must be 100% vegan with no animal products at all (no meat, fish, eggs, dairy, butter, gelatin, or honey)."
    );
  }

  if (recipe.dietaryRestrictions === DietaryRestrictions.KOSHER) {
    promptParts.push(
      "The dish must be strictly kosher style.",
      "Do not show pork or shellfish.",
      "Do not mix meat and dairy together anywhere in the image.",
      "Never show bacon, ham, pepperoni, salami, pork sausage, pancetta, guanciale, shrimp, lobster, or crab.",
      "If the recipe is dairy, do not show any meat.",
      "If the recipe is meat, do not show any dairy."
    );
  }

  if (Number(recipe.lactoseRestrictions) === 1) {
    promptParts.push(
      "The dish must be completely lactose-free: no visible dairy cheese, milk, cream, butter, yogurt, or other dairy ingredients."
    );
  }

  if (Number(recipe.glutenRestrictions) === 1) {
    promptParts.push(
      "The dish must be gluten-free: do not show regular bread, regular pasta, or obvious wheat flour products."
    );
  }

  if (cleanQueryRestrictions.length) {
    promptParts.push(
      `Do not show any of the following ingredients anywhere in the image: ${cleanQueryRestrictions.join(", ")}.`
    );
  }

  let lastErr: any;

  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptPromptParts = [...promptParts];

    if (attempt === 1) {
      attemptPromptParts.push(
        "CRITICAL: The image is INVALID if it contains any ingredient not listed in ALLOWED INGREDIENTS.",
        "CRITICAL: The image is INVALID if it looks like the common non-kosher default version of a famous dish instead of the recipe-constrained version.",
        "CRITICAL: For dishes like carbonara, breakfast pasta, creamy pasta, or deli-style pasta, never add bacon, ham, pepperoni, pancetta, guanciale, or pork unless those exact ingredients are present in ALLOWED INGREDIENTS, and for kosher recipes they are never allowed."
      );
    }

    const promptText = attemptPromptParts.join(" ");

    try {
      const result = await openaiImages.images.generate({
        model: "gpt-image-1.5",
        prompt: promptText,
        size: "1024x1024",
        quality: "medium"
      });

      if (!result.data?.[0]?.b64_json) {
        throw new Error("No image generated");
      }

      const imageBase64 = result.data[0].b64_json;
      const imagesDir = process.env.IMAGE_DIR || path.join(__dirname, "..", "1-assets", "images");

      await fs.mkdir(imagesDir, { recursive: true });

      const safeBase = String(title || query || "recipe")
        .toLowerCase()
        .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);

      const fileName = `${safeBase}-${crypto.randomUUID()}.png`;

      await fs.writeFile(path.join(imagesDir, fileName), Buffer.from(imageBase64, "base64"));

      const url = new URL(fileName, appConfig.baseImageUrl).toString();
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