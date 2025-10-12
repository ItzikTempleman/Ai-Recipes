import { useEffect, useState } from "react";
import { RecipeModel } from "../../Models/RecipeModel";
import "./RecipeCard.css";


type RecipeProps = { 
  recipe: RecipeModel
 };

export function RecipeCard({ recipe }: RecipeProps) {
  const [imgSrc, setImgSrc] = useState<string>("");

useEffect(() => {
  const url = (recipe.imageUrl ?? "").trim();
  setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
}, [recipe.imageUrl]
)

  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];

  return (
    <div className="RecipeCard">
      <h2>{recipe.title.title}</h2>

   {imgSrc && (
<img className="RecipeImage" 
  src={imgSrc}
  onError={() => setImgSrc("")}
  />
   )}

<div className="IngredientsList">
  {ingredients.map((line, index) => (
    <div key={index} className="IngredientRow">
      <span className="IngredientName">{line.ingredient}</span>
      <span className="IngredientAmount">{line.amount ?? ""}</span>
    </div>
  ))}
</div>

      <div className="InstructionsList">
        <h2>Instructions</h2>
        <ol>
          {instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}