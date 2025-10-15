import { useEffect } from "react";
import { useTitle } from "../../Utils/UseTitle";
import "./RecipeList.css";
import { recipeService } from "../../Services/RecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";



export function RecipeList() {
    useTitle("All recipes");
    const { items } = useSelector((state: AppState) => state.recipes);

    useEffect(
        () => {
            recipeService.getAllRecipes();
        }, []
    );

    return (
        <div className="RecipeList">
            <p className="Title">All recipes</p>
            <div className="List">
                {items.map((recipe) => (
                            <RecipeListItem
                                key={recipe.title}
                                recipe={recipe}/>
                        )
                    )
                }
            </div>
        </div>
    );
}
