import { useEffect } from "react";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import "./HomeScreen.css";
import { useTitle } from "../../Utils/Utils";
import { AppState } from "../../Redux/Store";
import { recipeService } from "../../Services/RecipeService";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
export function HomeScreen() {
  useTitle("Home");
  const { items } = useSelector((state: AppState) => state.recipes);
  const user = useSelector((state: AppState) => state.user);
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");

  useEffect(() => {
    recipeService.getAllRecipes();
    recipeService.loadMyLikes();
  }, [user?.id]);

  const list = Array.isArray(items) ? items : [];

  return (
    <div className="HomeScreen">
      <div className={`SiteTitleDiv ${isRTL ? "rtl" : "ltr"}`} ><div className="SiteTitle">{t("homeScreen.siteTitle")}</div></div>
      <div className={`HomeScreenTitleWrapper ${isRTL ? "rtl" : "ltr"}`}>
        {user ? (

          list.length === 0 ? (

            <div className="HomeScreenTitleContainer">
              <div className="UserHello">{t("homeScreen.hello")} {user.firstName} {user.familyName}</div>
              <h3 className="HomeScreenTitle">{t("homeScreen.noRecipes")}</h3>
            </div>
          ) : (

            <div className="HomeScreenTitleContainer">

              <h3 className="HomeScreenTitle">{t("homeScreen.recentlyViewed")}</h3>
            </div>
          )
        ) : (
          <div className="HomeScreenTitleContainer">
            <div className="GuestNotice">
              <div className="GuestHello">{t("homeScreen.hello")} {t("homeScreen.guest")}</div>
              <div className="GuestNoticeLine1">{t("homeScreen.guestNoticeLine1")}</div>
              <div className="GuestNoticeLine2">{t("homeScreen.guestNoticeLine2")}</div>
            </div>
          </div>
        )}
      </div>

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