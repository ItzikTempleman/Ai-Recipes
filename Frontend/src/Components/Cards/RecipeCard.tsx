import { useEffect, useState } from "react";
import { RecipeModel } from "../../Models/RecipeModel";
import "./RecipeCard.css";
import { appConfig } from "../../Utils/AppConfig";

type RecipeProps = { recipe: RecipeModel };

export function RecipeCard({ recipe }: RecipeProps) {
  const [imgSrc, setImgSrc] = useState<string>(appConfig.noImage);

useEffect(() => {
  setImgSrc(
    recipe.imageUrl && recipe.imageUrl.trim() !== ""
      ? recipe.imageUrl
      : appConfig.noImage
  );
}, [recipe.imageUrl, appConfig.noImage]);

<img
  src={imgSrc}
  loading="lazy"
  onError={() => {
   
    if (imgSrc !== appConfig.noImage) setImgSrc(appConfig.noImage);
  }}
/>
  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];

  return (
    <div className="RecipeCard">
      <h3>{recipe.title?.title ?? "Untitled recipe"}</h3>

<img className="RecipeImage" 
  src={imgSrc}
  loading="lazy"
  onError={() => {
    
    if (imgSrc !== appConfig.noImage) setImgSrc(appConfig.noImage);
  }}
/>

<div className="IngredientsList">
  {ingredients.map((line, index) => (
    <div key={index} className="IngredientRow">
      <span className="IngredientName">{line.ingredient}</span>
      <span className="IngredientAmount">{line.amount ?? ""}</span>
    </div>
  ))}
</div>

      <div className="InstructionsList">
        <h4>Instructions</h4>
        <ol>
          {instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}