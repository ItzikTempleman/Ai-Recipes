import { RecipeModel } from "../../../Models/RecipeModel";
import "./HistoryRecipeCard.css";

type RecipeProps = {
    recipe: RecipeModel;
}

export function HistoryRecipeCard({ recipe }: RecipeProps) {

    return (
        <div className="HistoryRecipeCard">
       {recipe.imageUrl && (

          <img className="HistoryCardImage" src={recipe.imageUrl} />
   
      )}
            <div className="HistoryCardTitle">{recipe.title.title}</div>
 

        </div>
    );
}
