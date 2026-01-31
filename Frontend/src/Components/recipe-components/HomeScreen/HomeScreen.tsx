import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import "./HomeScreen.css";
import { useTitle } from "../../../Utils/Utils";
import { AppState } from "../../../Redux/Store";
import { recipeService } from "../../../Services/RecipeService";
import { HistoryScreen } from "../HistoryScreen/HistoryScreen";
import { resetGenerated, stashGuestRecipe } from "../../../Redux/RecipeSlice";

export function HomeScreen() {
  useTitle("Home");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, current } = useSelector((state: AppState) => state.recipes);
  const user = useSelector((state: AppState) => state.user);
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    recipeService.getAllRecipes().catch(() => {});
    recipeService.loadMyLikes().catch(() => {});
  }, [user?.id]);
  const list = Array.isArray(items) ? items : [];
  const hasHistory = user && list.length > 0;
  const handleGenerateClick = useCallback(() => {
    const isGuest = !user;
    if (isGuest && current?.title) {
      dispatch(stashGuestRecipe(current));
    }
    dispatch(resetGenerated());
    navigate("/generate");
  }, [dispatch, navigate, user, current]);

  return (
    <div className={`HomeScreen ${user ? "user" : "guest"}`}>
      <div className={`HomeScreenTitleWrapper ${isRTL ? "rtl" : "ltr"}`}>
        {user ? (
          <>
            <Button
              className="GenerateBtn"
              onClick={handleGenerateClick}
              variant="contained">
              <AddIcon />
              {t("homeScreen.generate")}
            </Button>
            {list.length === 0 ? (
              <div className="HomeScreenTitleContainer ">
                <h3 className="HomeScreenTitle user">
                  {t("homeScreen.noRecipes")}
                </h3>
              </div>
            ) : (
              <h3 className="HomeScreenTitle user">
                {t("homeScreen.recentlyViewed")}
              </h3>
            )}
          </>
        ) : (
          <div>
            <h3 className="GuestTitle">{t("homeScreen.hello")}</h3>
            <Button
              className="GenerateBtn"
              onClick={handleGenerateClick}
              variant="contained" >
              <AddIcon />
              {t("homeScreen.generate")}
            </Button>
          </div>
        )}
      </div>
      <div className="HistoryDiv">
        {hasHistory ? <HistoryScreen list={list} /> : null}
      </div>
    </div>
  );
}