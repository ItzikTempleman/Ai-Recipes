import { useEffect } from "react";
import { useTitle } from "../../../Utils/Utils";
import "./HomeScreen.css";
import { recipeService } from "../../../Services/RecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { RecipeListItem } from "../../RecipeListItem/RecipeListItem";

export function HomeScreen() {
    useTitle("Home");
    const { items } = useSelector((state: AppState) => state.recipes);
const user = useSelector((state: AppState) => state.user);
    useEffect(
        () => {
            recipeService.getAllRecipes();
        }, []
    );
const list = Array.isArray(items) ? items : []; 

  return (
    <div className="HomeScreen">
      <p className="HomeScreenTitle">{user.firstName.trim()}'s recipes</p>
      <div className="RecipeList">
        {list.length === 0 ? (
          <div>No recipes</div>
        ) : (
          list.map((recipe) => (
            <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}
