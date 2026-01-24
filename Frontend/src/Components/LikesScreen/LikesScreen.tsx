import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTitle } from "../../Utils/Utils";
import { AppState } from "../../Redux/Store";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import "./LikesScreen.css";
import { recipeService } from "../../Services/RecipeService";
import { useEffect } from "react";

export function LikesScreen() {
  useTitle("Liked");

  const { items } = useSelector((state: AppState) => state.recipes);
  const likes = useSelector((state: AppState) => state.likes);
  const user = useSelector((state: AppState) => state.user);

  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user?.id) return;
    if (!Array.isArray(items) || items.length === 0) {
      recipeService.getAllRecipes().catch(() => {});
    }
    recipeService.loadMyLikes().catch(() => {});
  }, [user?.id]);
  
  const list = Array.isArray(items) ? items : [];
  const userId = user?.id;

  const likedIds = new Set(
    likes
      .filter((l) => l.userId === userId)
      .map((l) => l.recipeId)
      .filter((id) => id != null)
  );

  const likedList = list.filter((r) => r.id != null && likedIds.has(r.id));

  return (
    <div className="LikesScreen">
      <div className={`LikesScreenWrapper ${isRTL ? "rtl" : "ltr"}`}>
        <h3 className="LikeScreenTitle">{t("likeScreen.likedTitle")}</h3>

        <div className="RecipeList">
          {user && likedList.length > 0
            ? likedList.map((recipe) => (
                <RecipeListItem
                  key={recipe.id ?? recipe.title}
                  recipe={recipe}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
