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
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import { notify } from "../../../Utils/Notify";
import { suggestionsService } from "../../../Services/SuggestionsService";

export function HomeScreen() {
  useTitle("Home");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, current } = useSelector((state: AppState) => state.recipes);
const suggestedRecipeItem = useSelector(
  (state: AppState) => state.recipes.dailyRecipes
);
  const user = useSelector((state: AppState) => state.user);

  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");


  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
  
    setShowSuggestions(!user);
  }, [user]);


  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) return;
    suggestionsService.getToday().catch(notify.error);
    recipeService.getAllRecipes().catch(notify.error);
  }, [token]);

  const recentlyViewedList = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const suggestionsList = useMemo(
    () => (Array.isArray(suggestedRecipeItem) ? suggestedRecipeItem : []),
    [suggestedRecipeItem]
  );

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
        {
          !user &&(<h3 className="GuestTitle">{t("homeScreen.hello")}</h3>)
        }
        

        <div className="SelectionDiv">
          <Button className="GenerateBtn" onClick={handleGenerateClick} variant="contained">
            <AddIcon />
            {t("homeScreen.generate")}
          </Button>

          {user && (
            <div className={`SelectListDiv ${isRTL ? "rtl" : "ltr"}`}>
              <div
                className={`RecentlyViewedBtn ${!showingSuggestions ? "active" : ""}`}
                onClick={() => setShowSuggestions(false)}
                role="button"
                tabIndex={0}
              >
         <h4>{t("homeScreen.history")}</h4>
              </div>

              <div
                className={`SuggestionsBtn ${showingSuggestions ? "active" : ""}`}
                onClick={() => setShowSuggestions(true)}
                role="button"
                tabIndex={0}
              >
            <h4>{t("homeScreen.suggestions2")}</h4>
              </div>
            </div>
          )}

          {showingSuggestions ? (
            <h3 className="HomeScreenTitle user">
              {t("homeScreen.suggestions") || "Suggestions"}
            </h3>
          ) : recentlyViewedList.length === 0 ? (
            <div className="HomeScreenTitleContainer">
              <h3 className="HomeScreenTitle user">{t("homeScreen.noRecipes")}</h3>
            </div>
          ) : (
            <h3 className="HomeScreenTitle user">{t("homeScreen.recentlyViewed")}</h3>
          )}

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
