import { useEffect } from "react";
import { useTitle } from "../../../Utils/UseTitle";
import "./HistoryScreen.css";
import { recipeService } from "../../../Services/RecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { HistoryRecipeCard } from "../../CardsArea/HistoryRecipeCard/HistoryRecipeCard";


export function HistoryScreen() {
    useTitle("History Screen");
    const { items } = useSelector((state: AppState) => state.recipes);

    useEffect(
        () => {
            recipeService.getAllRecipes();
        }, []
    );

    return (
        <div className="HistoryScreen">
            <p className="HistoryTitle">History</p>
            <div className="HistoryCards">
                {items.map((recipe) => (
                            <HistoryRecipeCard
                                key={recipe.title}
                                recipe={recipe}/>
                        )
                    )
                }
            </div>
        </div>
    );
}
