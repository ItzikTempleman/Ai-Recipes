import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RecipeModel } from "../../../Models/RecipeModel";
import { DataScreen } from "../../recipe-components/DataScreen/DataScreen";

// This is the wrapper that your normal recipe page uses.
// Without it, PdfScreen won't be 1:1 with DataScreen layout.
import "../RecipeDataContainer/RecipeDataContainer.css";

import "./PdfScreen.css";

export function PdfScreen() {
  const { i18n } = useTranslation();
  const { recipeId } = useParams();
  const id = Number(recipeId);

  const [recipe, setRecipe] = useState<RecipeModel | null>(null);

  useEffect(() => {
    document.body.classList.add("share-render-mode");
    return () => document.body.classList.remove("share-render-mode");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      fetch(`/api/share-payload/${token}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        })
        .then((data) => setRecipe(data))
        .catch(() => setRecipe(null));
      return;
    }

    if (!id || id <= 0) return;

    fetch(`/api/recipe/public/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setRecipe(data))
      .catch(() => setRecipe(null));
  }, [id]);

  const hasHebrew = (s: unknown) => /[\u0590-\u05FF]/.test(String(s ?? ""));

  const { headingLng, headingDir } = useMemo<{
    headingLng: "he" | "en";
    headingDir: "rtl" | "ltr";
  }>(() => {
    if (!recipe) return { headingLng: "en", headingDir: "ltr" };

    const ingredients = (recipe as any)?.data?.ingredients ?? [];
    const instructions = (recipe as any)?.data?.instructions ?? [];

    const recipeIsHebrew =
      hasHebrew((recipe as any)?.title) ||
      hasHebrew((recipe as any)?.description) ||
      ingredients.some((x: any) => hasHebrew(x?.ingredient ?? x)) ||
      instructions.some((x: any) => hasHebrew(x));

    return {
      headingLng: recipeIsHebrew ? "he" : "en",
      headingDir: recipeIsHebrew ? "rtl" : "ltr",
    };
  }, [recipe]);

  useEffect(() => {
    if (!recipe) return;
    if (i18n.language !== headingLng) i18n.changeLanguage(headingLng);
  }, [recipe, headingLng, i18n]);

  if (!recipe) return null;

  const filters = {
    sugarLevel: recipe.sugarRestriction as any,
    hasLactose: recipe.lactoseRestrictions as any,
    hasGluten: recipe.glutenRestrictions as any,
    dietType: recipe.dietaryRestrictions as any,
  };

  return (
    <div className="PdfScreen">
      <div
        id="recipe-print-root"
        className="RecipeDataContainer share-print-root"
        dir={headingDir}
        lang={headingLng}
      >
        <DataScreen
          recipe={recipe}
          imageSrc={(recipe as any).imageUrl ?? (recipe as any).image ?? ""}
          filters={filters as any}
          shareMode={true}
        />
      </div>
    </div>
  );
}