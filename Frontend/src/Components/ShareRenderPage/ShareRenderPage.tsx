import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RecipeModel } from "../../Models/RecipeModel";
import { RecipeData } from "../RecipeData/RecipeData";
import "./ShareRenderPage.css";

export function ShareRenderPage() {
  const { recipeId } = useParams();
  const id = Number(recipeId);

  const [recipe, setRecipe] = useState<RecipeModel | null>(null);

  // Hide site chrome only while this route is mounted:
  useEffect(() => {
    document.body.classList.add("share-render-mode");
    return () => document.body.classList.remove("share-render-mode");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Guest share: fetch payload by token
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

    // Saved recipe share: fetch public recipe by id
    if (!id || id <= 0) return;

    fetch(`/api/recipe/public/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setRecipe(data))
      .catch(() => setRecipe(null));
  }, [id]);

  // After the recipe renders, tag the "stats squares" container so print CSS can keep it together
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

    // If we didn't find most labels, don't tag anything
    if (labelEls.length < 3) return;

    // Build ancestor lists
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

    // Find first common ancestor
    let common: HTMLElement | null = null;
    for (const candidate of ancestorLists[0]) {
      if (ancestorLists.every((lst) => lst.includes(candidate))) {
        common = candidate;
        break;
      }
    }
    if (!common) return;

    // Walk up until we contain BOTH rows (the split happens between rows)
    // We stop when parent is root or when width grows to full block.
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

  return (
    <div id="recipe-print-root" className="share-print-root">
      <RecipeData
        recipe={recipe}
        imageSrc={recipe.imageUrl ?? ""}
        filters={recipe.queryRestrictions as any}
        shareMode={true}
      />
    </div>
  );
}
