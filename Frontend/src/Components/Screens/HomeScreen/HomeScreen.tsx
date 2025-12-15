import { useEffect } from "react";
import { useTitle } from "../../../Utils/Utils";
import "./HomeScreen.css";
import { recipeService } from "../../../Services/RecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { RecipeListItem } from "../../RecipeListItem/RecipeListItem";
import { useTranslation } from "react-i18next";

export function HomeScreen() {
    useTitle("Home");
    const { items } = useSelector((state: AppState) => state.recipes);
const user = useSelector((state: AppState) => state.user);
    useEffect(
        () => {
            recipeService.getAllRecipes();
        }, []
    );
        const { t } = useTranslation();
const list = Array.isArray(items) ? items : []; 

  return (
    <div className="HomeScreen">
      {user&&(
      <p className="HomeScreenTitle">{user.firstName.trim()}'s recipes</p>
      )}

      <div className="RecipeList">
{user&&(
        list.length === 0 ? (
          <div>{t("homeScreen.noRecipes")}</div>
        ) : (
          list.map((recipe) => (
            <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
          ))
        )
        )}
              {!user&&(
      <p className="HomeScreenTitle">{t("homeScreen.guestNotice")}</p>
      )}
      </div>
    </div>
  );
}
