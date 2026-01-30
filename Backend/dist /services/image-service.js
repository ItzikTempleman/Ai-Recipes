"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
const recipe_model_1 = require("../models/recipe-model");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const app_config_1 = require("../utils/app-config");
const filters_1 = require("../models/filters");
async function generateImage(recipe) {
    const lowerQuery = String(recipe.query ?? "").toLowerCase();
    const extraBanned = [];
    const title = String(recipe?.title ?? "").trim();
    const query = String(recipe?.query ?? "").trim();
    const ingredientNames = recipe.ingredients?.map((x) => String(x?.ingredient ?? "").trim()).filter(Boolean) ?? [];
    const allowed = ingredientNames.slice(0, 40).join(", ");
    const methodHint = recipe.instructions?.slice(0, 4).join(" ").replace(/\s+/g, " ").slice(0, 700) ?? "";
    const promptParts = [
        `fhd quality realistic food photo of the finished cooked dish for this recipe.`,
        // Keep the original label present, but do NOT anchor generation to "real-world reference photos"
        `Dish label (do not render text): "${title || query}".`,
        `RENDER SPEC (CRITICAL):
- Render the dish to match the RECIPE composition, not a generic default or a guessed "reference photo" dish.
- The dish must visually align with the dish label AND the ingredient list AND the method cues.
- If the dish label is not a globally-canonical dish name, DO NOT guess a standard dish. Use the RECIPE as ground truth.`,
        `COMPOSITION & VISIBILITY (CRITICAL):
- Show only the finished dish on a simple plate/tray/pan. No hands, no utensils in motion, no extra props.
- Do NOT add side dishes unless explicitly part of the recipe OR listed in ALLOWED INGREDIENTS.
- Do NOT add garnish, herbs, toppings, or decorative elements unless they are explicitly in ALLOWED INGREDIENTS.
- Every primary ingredient that would be visible in the finished dish MUST be visible in a realistic cooked form.
- The image is INVALID if it looks like a generic substitute dish instead of the recipe described.`,
        `APPETIZING REALISM (CRITICAL):
- Make it look freshly cooked and appetizing (not dry, not stale, not dusty, not chalky, not matte).
- Use natural kitchen/restaurant lighting (avoid harsh studio/catalog lighting).
- Natural cooking artifacts are allowed and expected (these are NOT separate ingredients):
  • sauce gloss and slight oil separation
  • moist surfaces and juices
  • bubbling sauce/cheese, steam
  • browning/char/caramelization where appropriate
- Avoid "AI-clean" perfection: include natural irregularities and believable textures.`,
        `INGREDIENT DISCIPLINE (CRITICAL):
- ONLY show ingredients that appear in ALLOWED INGREDIENTS as identifiable ingredients/toppings.
- Do NOT invent extra toppings, garnishes, herbs, or decorative elements.
- Depict ingredients in their realistic cooked form for THIS dish (melted vs unmelted; sliced vs diced; crumbled vs grated; sauced vs dry).`,
        `TECHNIQUE FIDELITY (CRITICAL):
- The visuals must match the cooking method cues (baked vs fried vs simmered/poached vs grilled).
- If the method implies simmering/braising/poaching in liquid: surfaces should look tender and liquid-coated, with minimal crust.
- If the method implies frying/searing/grilling: show crisp browning/char appropriately.`,
        `ALLOWED INGREDIENTS (ONLY these may appear as identifiable ingredients/toppings): ${allowed}. If something is not listed here, it must NOT be added as a topping, garnish, herb, or side dish. Do not add "common garnishes" unless they are explicitly listed here.`,
        `METHOD CUES (must match the look): ${methodHint}`,
        `QUALITY GUARDS:
- No snow-like curds, cottony clumps, plastic shine, waxy surfaces, or powdery/dusty look.
- No perfect symmetry or identical repeated shapes.`
    ];
    if (recipe.dietaryRestrictions === filters_1.DietaryRestrictions.VEGAN) {
        promptParts.push("The dish must be 100% vegan with no animal products at all (no meat, fish, eggs, dairy, butter, gelatin, or honey). Ensure the visuals match realistic vegan versions of the dish (no animal-like textures).");
    }
    if (recipe.dietaryRestrictions === filters_1.DietaryRestrictions.KOSHER) {
        promptParts.push("The dish must be strictly kosher style: no pork and no shellfish.", "Do not mix meat and dairy together anywhere in the image.", "If there is visible meat, absolutely do not show any cheese, butter, cream, or other dairy near it.", "Never include anything from the excluded/forbidden ingredients list.");
        extraBanned.push("pepperoni", "bacon", "ham", "salami", "sausage", "shrimp", "lobster", "crab");
        if (extraBanned.length) {
            promptParts.push(`Do not show any of the following ingredients anywhere in the image: ${extraBanned.join(", ")}.`);
        }
    }
    const isLactoseFree = Number(recipe.lactoseRestrictions) === 1;
    if (isLactoseFree) {
        promptParts.push("The dish must be completely lactose-free: no visible dairy cheese, milk, cream, butter, yogurt, or other dairy ingredients. If the recipe includes a plant-based melting cheese, it must be shown as a realistic melted/softened vegan cheese layer.");
    }
    const isGlutenFree = Number(recipe.glutenRestrictions) === 1;
    if (isGlutenFree) {
        promptParts.push("The dish must be gluten-free: do not show bread, regular pasta, or obvious wheat flour products; use visually plausible gluten-free alternatives instead, while still matching the dish identity.");
    }
    if (recipe.queryRestrictions?.length) {
        const excluded = (recipe.queryRestrictions ?? []).map((x) => String(x).trim()).filter(Boolean);
        if (excluded.length) {
            promptParts.push(`Do not show any of the following ingredients anywhere in the image: ${excluded.join(", ")}.`);
        }
    }
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
        const attemptPromptParts = [...promptParts];
        if (attempt === 1) {
            attemptPromptParts.push("CRITICAL: The image is invalid if the dish looks dry, chalky, dusty, matte, or stale instead of freshly cooked and appetizing.", "CRITICAL: The image is invalid if it contains any excluded ingredient.", "CRITICAL: The image is invalid if it contains any ingredient not listed in ALLOWED INGREDIENTS.", "CRITICAL: The image is invalid if textures look like AI artifacts (e.g., snow-like cheese curds, cottony clumps, plastic shine) instead of real food surfaces.", "CRITICAL: The image is invalid if it looks like a generic substitute dish rather than the dish described by the recipe; it must match the recipe composition and method cues.");
            // Keep your pizza-specific emphasis, but make it composition-based (not identity-based)
            if (lowerQuery.includes("pizza") || lowerQuery.includes("piza") || lowerQuery.includes("pitsa") || query.includes("פיצה") || title.includes("פיצה")) {
                attemptPromptParts.push("CRITICAL: For pizza, the image must look hot, melty, and moist with visible sauce coverage and realistic cheese sheen (not dry or dusty).");
            }
        }
        const promptText = attemptPromptParts.join(" ");
        try {
            const result = await recipe_model_1.openaiImages.images.generate({
                model: "gpt-image-1.5",
                prompt: promptText,
                size: "1024x1024",
                quality: "medium"
            });
            if (!result.data?.[0]?.b64_json)
                throw new Error("No image generated");
            const imageBase64 = result.data[0].b64_json;
            const imagesDir = process.env.IMAGE_DIR || path_1.default.join(__dirname, "..", "1-assets", "images");
            await promises_1.default.mkdir(imagesDir, { recursive: true });
            const safeTitle = String(recipe.query ?? "")
                .toLowerCase()
                .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
                .replace(/^-+|-+$/g, "");
            const fileName = `${safeTitle}-recipe.png`;
            await promises_1.default.writeFile(path_1.default.join(imagesDir, fileName), Buffer.from(imageBase64, "base64"));
            const url = new URL(encodeURIComponent(fileName), app_config_1.appConfig.baseImageUrl).toString();
            return { fileName, url };
        }
        catch (err) {
            console.error("OpenAI IMAGE:", err?.response?.data);
            lastErr = err;
            if (err?.response?.status === 429) {
                const retryAfter = Number(err?.response?.headers?.["retry-after"]) || 1500;
                await new Promise((r) => setTimeout(r, retryAfter));
                continue;
            }
            if (attempt === 0)
                continue;
            throw err;
        }
    }
    throw lastErr;
}
