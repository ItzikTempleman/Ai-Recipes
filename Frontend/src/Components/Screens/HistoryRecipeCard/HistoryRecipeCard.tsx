import { RecipeModel } from "../../../Models/RecipeModel";
import "./HistoryRecipeCard.css";

type RecipeProps = {
    recipe: RecipeModel;
}

export function HistoryRecipeCard({ recipe }: RecipeProps) {
    const cardClassName = recipe.imageUrl 
        ? "HistoryRecipeCard" 
        : "NoImageHistoryRecipeCard";
console.log("🌱 Test change — feature branch only");
    return (
        <div className={cardClassName}>
            {recipe.imageUrl && (
                <img className="HistoryCardImage" src={recipe.imageUrl} />
                
            )}
            <div className="HistoryCardTitleContainer">
            <div className="HistoryCardTitle">{recipe.title.title}</div>
            </div>
        </div>
    );
}
