import { InputModel } from "../3-models/InputModel";
import { GPTImage, openaiImages } from "../3-models/recipe-model";
import fs from "fs/promises";
import path from "path";
import { appConfig } from "../2-utils/app-config";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions } from "../3-models/filters";

export  async function generateImage(recipe: InputModel): Promise<GPTImage> {

  const promptParts: string[] = [
    `High-resolution, super realistic food photo of: ${recipe.query}`,
    "Show only the finished plated dish, no text or logos."
  ];

  if (recipe.dietaryRestrictions === DietaryRestrictions.VEGAN) {
    promptParts.push(
      "The dish must be 100% vegan with no animal products at all (no meat, fish, eggs, dairy, butter, gelatin, or honey)."
    );
  }

  if (recipe.dietaryRestrictions === DietaryRestrictions.KOSHER) {
    promptParts.push(
      "The dish must be kosher style: no pork, bacon, rabbit, snakes, insects, ham, seafood or shellfish.",
      "Do not mix meat and dairy together anywhere in the image."
    );

    promptParts.push(
      "If the dish contains meat (for example a hamburger), do not show any cheese, butter, cream, or other dairy on or near the meat.",
      "Use only non-dairy toppings such as vegetables and sauces that do not look like cheese."
    );
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
      "The dish must be gluten-free: do not show bread, regular pasta, or obvious wheat flour products. Use visually plausible gluten-free alternatives instead."
    );
  }

  if (recipe.queryRestrictions?.length) {
    promptParts.push(
      `Do not show any of the following ingredients anywhere in the image: ${recipe.queryRestrictions.join(", ")}.`
    );
  }

  const promptText = promptParts.join(" ");

  let lastErr: any;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await openaiImages.images.generate({
        model: "gpt-image-1",
        prompt: promptText,
        size: "1024x1024"
      });

      if (!result.data?.[0]?.b64_json) throw new Error("No image generated");

      const imageBase64 = result.data[0].b64_json;
      const imagesDir =
        process.env.IMAGE_DIR || path.join(__dirname, "..", "1-assets", "images");
      await fs.mkdir(imagesDir, { recursive: true });

      const safeTitle = recipe.query
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
        const retryAfter =
          Number(err?.response?.headers?.["retry-after"]) || 1500; // ms
        await new Promise((r) => setTimeout(r, retryAfter));
        continue;
      }

      throw err;
    }
  }

  throw lastErr;


    // const promptText = `High-resolution, super realistic food photo of: ${recipe.query}`;

    // let lastErr: any;
    // for (let attempt = 0; attempt < 2; attempt++) {
    //   try {
    //     const result = await openaiImages.images.generate({
    //       model: "gpt-image-1",
    //       prompt: promptText,
    //       size: "1024x1024"
    //     });

    //     if (!result.data?.[0]?.b64_json) throw new Error("No image generated");

    //     const imageBase64 = result.data[0].b64_json;
    //     const imagesDir = process.env.IMAGE_DIR || path.join(__dirname, "..", "1-assets", "images");
    //     await fs.mkdir(imagesDir, { recursive: true });
    //     const safeTitle = recipe.query
    //       .toLowerCase()
    //       .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
    //       .replace(/^-+|-+$/g, "");

    //     const fileName = `${safeTitle}-recipe.png`;
    //     await fs.writeFile(
    //       path.join(imagesDir, fileName),
    //       Buffer.from(imageBase64, "base64")
    //     );

    //     const url = new URL(encodeURIComponent(fileName), appConfig.baseImageUrl).toString();
    //     return { fileName, url };
    //   } catch (err: any) {
    //     console.error("OpenAI IMAGE:", err?.response?.data);
    //     lastErr = err;

    //     if (err?.response?.status === 429) {
    //       const retryAfter =
    //         Number(err?.response?.headers?.["retry-after"]) || 1500; // ms
    //       await new Promise((r) => setTimeout(r, retryAfter));
    //       continue;
    //     }
    //     throw err;
    //   }
    // }
    // throw lastErr;
  }