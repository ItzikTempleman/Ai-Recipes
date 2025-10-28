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
const list = Array.isArray(items) ? items : []; 

  return (
    <div className="RecipeList">
      <p className="Title">All recipes</p>
      <div className="List">
        {list.length === 0 ? (
          <div>No recipes yet. Create one on the Generate page.</div>
        ) : (
          list.map((recipe) => (
            <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}
