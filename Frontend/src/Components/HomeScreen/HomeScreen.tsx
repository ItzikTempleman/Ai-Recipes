import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import LoginIcon from "@mui/icons-material/Login";
import "./HomeScreen.css";
import { useTitle } from "../../Utils/Utils";
import { AppState } from "../../Redux/Store";
import { recipeService } from "../../Services/RecipeService";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import { useNavigate } from "react-router-dom";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AddIcon from "@mui/icons-material/Add";

export function HomeScreen() {
  useTitle("Home");
  const { items } = useSelector((state: AppState) => state.recipes);
  const user = useSelector((state: AppState) => state.user);
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    recipeService.getAllRecipes().catch(() => { });
    recipeService.loadMyLikes().catch(() => { });
  }, [user?.id]);

  const list = Array.isArray(items) ? items : [];

  return (
    <div className="HomeScreen">
      <div className={`HomeScreenTitleWrapper ${isRTL ? "rtl" : "ltr"}`}>
        {user ? (
          <>
            <div
              className="GuestInstructions"
              onClick={() => navigate("/generate")}>
              <AddIcon />
              <h4 className="GuestGenerate">{t("homeScreen.generate")}</h4>
            </div>
            {list.length === 0 ? (
              <div className="HomeScreenTitleContainer ">
                <div className="UserHello">
                  {t("homeScreen.hello")} {user.firstName} {user.familyName}
                </div>
                <h3 className="HomeScreenTitle user">{t("homeScreen.noRecipes")}</h3>
              </div>
            ) : (
              <h3 className="HomeScreenTitle user">{t("homeScreen.recentlyViewed")}</h3>
            )}
          </>) : (
          <>
            <div className="GuestNotice">
              <div className="GuestHello">
                {t("homeScreen.hello")} {t("homeScreen.guest")}
              </div>
              <div
                className="GuestInstructions"
                onClick={() => navigate("/generate")} >
                <AddIcon />
                <h4 className="GuestGenerate">{t("homeScreen.generate")}</h4>
              </div>
              <div
                className="GuestLoginContainer"
                onClick={() => navigate("/login")}
              >
                <LoginIcon />
                <h4 className="GuestLoginTitle">{t("drawer.login")}</h4>
              </div>
            </div>
            <h3 className="GuestNoticeLine2">
              {t("homeScreen.guestNoticeLine2")}
            </h3>
            <div className="ShareIntro">
              <PictureAsPdfIcon className="ShareIntroIcon" />
              <h1 className="ShareIntroTitle">{t("homeScreen.shareIntro")}</h1>
            </div>
          </>
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
