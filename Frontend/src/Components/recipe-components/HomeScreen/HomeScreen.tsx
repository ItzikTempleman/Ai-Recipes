import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import "./HomeScreen.css";
import { useTitle } from "../../../Utils/Utils";
import { AppState } from "../../../Redux/Store";
import { recipeService } from "../../../Services/RecipeService";
import { resetGenerated, stashGuestRecipe } from "../../../Redux/RecipeSlice";
import HistoryIcon from "@mui/icons-material/History";
import AssistantIcon from "@mui/icons-material/Assistant";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import { notify } from "../../../Utils/Notify";

export function HomeScreen() {
  useTitle("Home");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, current } = useSelector((state: AppState) => state.recipes);
  const suggestedRecipeItem = useSelector((state: AppState) => state.suggestedRecipes);
  const user = useSelector((state: AppState) => state.user);

  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");

  // Tabs
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Fetch history recipes when token exists (logged-in sessions)
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) return;
    recipeService.getAllRecipes().catch(notify.error);
  }, [token]);

  const recentlyViewedList = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const suggestionsList = useMemo(
    () => (Array.isArray(suggestedRecipeItem) ? suggestedRecipeItem : []),
    [suggestedRecipeItem]
  );

  // ✅ IMPORTANT: when user logs in/out, force the correct default
  useEffect(() => {
    if (!user) {
      // logout / guest
      setShowHistory(false);
      setShowSuggestions(true);
    } else {
      // login
      setShowHistory(true);
      setShowSuggestions(false);
    }
  }, [user]);

  const showingSuggestions = !user || showSuggestions;
  const activeList = showingSuggestions ? suggestionsList : recentlyViewedList;

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
        <h3 className="GuestTitle">{t("homeScreen.hello")}</h3>

        <div className="SelectionDiv">
          <Button className="GenerateBtn" onClick={handleGenerateClick} variant="contained">
            <AddIcon />
            {t("homeScreen.generate")}
          </Button>

          {/* Toggle only when logged in */}
          {user && (
            <div className={`SelectListDiv ${isRTL ? "rtl" : "ltr"}`}>
              <div
                className={`RecentlyViewedBtn ${!showingSuggestions ? "active" : ""}`}
                onClick={() => {
                  setShowHistory(true);
                  setShowSuggestions(false);
                }}
              >
                <HistoryIcon />
              </div>

              <div
                className={`SuggestionsBtn ${showingSuggestions ? "active" : ""}`}
                onClick={() => {
                  setShowSuggestions(true);
                  setShowHistory(false);
                }}
              >
                <AssistantIcon />
              </div>
            </div>
          )}

          {/* ✅ Title ALWAYS rendered (guest included) */}
          {showingSuggestions ? (
            <h3 className="HomeScreenTitle user">
              {t("homeScreen.suggestions") || "Suggestions"}
            </h3>
          ) : (
            <>
              {recentlyViewedList.length === 0 ? (
                <div className="HomeScreenTitleContainer">
                  <h3 className="HomeScreenTitle user">{t("homeScreen.noRecipes")}</h3>
                </div>
              ) : (
                <h3 className="HomeScreenTitle user">{t("homeScreen.recentlyViewed")}</h3>
              )}
            </>
          )}

          {/* Grid ALWAYS renders (even if list is empty) */}
          <div className="RecipeGrid">
            {activeList.map((recipe) => (
              <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
