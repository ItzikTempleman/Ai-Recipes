import { useEffect } from "react";
import { useTitle } from "../../../Utils/UseTitle";
import "./HistoryScreen.css";
import { recipeService } from "../../../Services/RecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { HistoryRecipeCard } from "../HistoryRecipeCard/HistoryRecipeCard";

export function HistoryScreen() {
    useTitle("History Screen");
    const { items} = useSelector((state: AppState) => state.recipes);


    useEffect(
        ()=>{
recipeService.getAllRecipes();

        },[]
    );

    return (
        <div className="HistoryScreen">
            <h2 className="HistoryTitle">History</h2>
            <div>
                {
items.map(
    (recipe)=>(
             <HistoryRecipeCard
            key={recipe.id ?? recipe.title?.title}
            recipe={recipe}
          />
    )
)
                }
            </div>
        </div>
    );
}
