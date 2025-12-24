import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RecipeModel } from "../../Models/RecipeModel";
import { RecipeData } from "../RecipeData/RecipeData";

export function ShareRenderPage() {
  const { recipeId } = useParams();
  const id = Number(recipeId);

  const [recipe, setRecipe] = useState<RecipeModel | null>(null);

  useEffect(() => {
    if (!id || id <= 0) return;

    fetch(`/api/recipe/${id}`, { credentials: "include" })
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