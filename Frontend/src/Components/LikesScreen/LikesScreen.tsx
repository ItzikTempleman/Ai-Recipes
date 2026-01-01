import { useSelector } from "react-redux";
import { useTitle } from "../../Utils/Utils";
import "./LikesScreen.css";
import { AppState } from "../../Redux/Store";
import { useTranslation } from "react-i18next";

import { RecipeListItem } from "../RecipeListItem/RecipeListItem";

export function LikesScreen() {
      useTitle("Liked");
  const { items } = useSelector((state: AppState) => state.recipes);
  const likes = useSelector((state: AppState) => state.likes);
  const user = useSelector((state: AppState) => state.user);
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");


  const list = Array.isArray(items) ? items : [];
const userId = user?.id;

const likedIds = new Set(
  likes.filter(l => l.userId === userId).map(l => l.recipeId)
);

const likedList = list.filter(
  r => r.id != null && likedIds.has(r.id)
);

    return (
        <div className="LikesScreen">
              <div className={`LikesScreenWrapper ${isRTL ? "rtl" : "ltr"}`}>
 <h3 className="LikeScreenTitle">{t("likeScreen.likedTitle")}</h3>

       <div className="RecipeList">
         {likes.length > 0
           ? likedList.map((recipe) => (
             <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
           ))
           : null}
       </div>
        </div>
        </div>
    );
}
