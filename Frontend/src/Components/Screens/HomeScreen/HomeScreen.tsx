import { useEffect } from "react";
import { RecipeListItem } from "../../RecipeListItem/RecipeListItem";
import { recipeService } from "../../../Services/RecipeService";
import { AppState } from "../../../Redux/Store";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTitle } from "../../../Utils/Utils";
import "./HomeScreen.css";
export function HomeScreen() {
  useTitle("Home");
  const { items } = useSelector((state: AppState) => state.recipes);
  const user = useSelector((state: AppState) => state.user);
  const { t } = useTranslation();

  useEffect(() => {
    recipeService.getAllRecipes();
    recipeService.loadMyLikes();
  }, [user?.id]);

  const list = Array.isArray(items) ? items : [];

  return (
    <div className="HomeScreen">

      {user ? (
        
        list.length === 0 ? (
        <div className="HomeScreenTitleContainer"><h2 className="HomeScreenTitle">{t("homeScreen.noRecipes")}</h2></div>
        ) : (
           <div className="HomeScreenTitleContainer"><h2 className="HomeScreenTitle">{t("homeScreen.recentlyViewed")}</h2></div>
        )
      ) : (
        <div className="HomeScreenTitleContainer"> <h2 className="HomeScreenTitle">{t("homeScreen.guestNotice")}</h2></div>
      )
      }

      <div className="RecipeList">
        {user && list.length > 0
          ? list.map((recipe) => (
              <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
            ))
          : null}
      </div>
    </div>
  );
}