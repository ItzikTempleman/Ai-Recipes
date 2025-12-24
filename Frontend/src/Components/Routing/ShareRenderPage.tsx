import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RecipeModel } from "../../Models/RecipeModel";
import { RecipeData } from "../RecipeData/RecipeData";

export function ShareRenderPage() {
  const { recipeId } = useParams();
  const id = Number(recipeId);

  const [recipe, setRecipe] = useState<RecipeModel | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // ✅ Guest share (no recipeId): fetch payload by token
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

    // ✅ Saved recipe share: fetch public recipe by id
    if (!id || id <= 0) return;

    fetch(`/api/recipe/public/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setRecipe(data))
      .catch(() => setRecipe(null));
  }, [id]);

  if (!recipe) return null;

  return (
    <RecipeData
      recipe={recipe}
      imageSrc={recipe.imageUrl ?? ""}
      filters={recipe.queryRestrictions as any}
      shareMode={true}
    />
  );
}
