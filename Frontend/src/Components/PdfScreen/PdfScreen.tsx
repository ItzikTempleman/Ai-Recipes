import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RecipeModel } from "../../Models/RecipeModel";
import { DataScreen } from "../DataScreen/DataScreen";
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

  // Detect content language/direction based on recipe text (not UI language)
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
    if (i18n.language !== headingLng) {
      i18n.changeLanguage(headingLng);
    }

  }, [recipe, headingLng]);


  useEffect(() => {
    if (!recipe) return;

    const root = document.getElementById("recipe-print-root");
    if (!root) return;

    const labels = ["Calories", "Sugar", "Protein", "Health"];

    const labelEls: HTMLElement[] = [];
    for (const txt of labels) {
      const el = Array.from(root.querySelectorAll<HTMLElement>("*")).find(
        (n) => (n.textContent ?? "").trim() === txt
      );
      if (el) labelEls.push(el);
    }

    if (labelEls.length < 3) return;

    const ancestorLists = labelEls.map((el) => {
      const list: HTMLElement[] = [];
      let cur: HTMLElement | null = el;
      while (cur && cur !== root) {
        list.push(cur);
        cur = cur.parentElement;
      }
      list.push(root);
      return list;
    });

    let common: HTMLElement | null = null;
    for (const candidate of ancestorLists[0]) {
      if (ancestorLists.every((lst) => lst.includes(candidate))) {
        common = candidate;
        break;
      }
    }
    if (!common) return;

    let container = common;
    for (let i = 0; i < 6; i++) {
      const p = container.parentElement as HTMLElement | null;
      if (!p) break;
      if (p === root) break;
      container = p;
    }

    container.setAttribute("data-print-block", "stats");
  }, [recipe]);

  if (!recipe) return null;

  const filters = {
    sugarLevel: recipe.sugarRestriction as any,
    hasLactose: recipe.lactoseRestrictions as any,
    hasGluten: recipe.glutenRestrictions as any,
    dietType: recipe.dietaryRestrictions as any,
  };

  return (
    <div className="PdfScreen">
      <div id="recipe-print-root" className="share-print-root" dir={headingDir} lang={headingLng}>
        <div className="PdfBannerWatermark" aria-hidden="true">
          <h3>Itzik's AI Recipes</h3>
        </div>

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
