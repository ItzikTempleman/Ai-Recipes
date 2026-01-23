import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    recipeService.getAllRecipes().catch(() => {});
    recipeService.loadMyLikes().catch(() => {});
  }, [user?.id]);

  const list = Array.isArray(items) ? items : [];

  return (
    <div className="HomeScreen">
      <div className={`HomeScreenTitleWrapper ${isRTL ? "rtl" : "ltr"}`}>
        {user ? (
          <>
            <Button
              className="GenerateBtn"
              onClick={() => navigate("/generate")}
              variant="contained"
            >
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
            <Button
              className="GenerateBtn"
              onClick={() => navigate("/generate")}
              variant="contained">
              <AddIcon />
              {t("homeScreen.generate")}
            </Button>
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
