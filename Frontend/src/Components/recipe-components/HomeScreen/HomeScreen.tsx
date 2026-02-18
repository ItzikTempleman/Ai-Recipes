import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "@mui/material";
import "./HomeScreen.css";
import { useTitle } from "../../../Utils/Utils";
import { AppState } from "../../../Redux/Store";
import { recipeService } from "../../../Services/RecipeService";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import { notify } from "../../../Utils/Notify";
import { suggestionsService } from "../../../Services/SuggestionsService";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { RecipeInputDialog } from "../RecipeInputDialog/RecipeInputDialog";
import { resetGenerated, setCurrent, stashGuestRecipe } from "../../../Redux/RecipeSlice";
import { Filters, RecipeDataContainer } from "../RecipeDataContainer/RecipeDataContainer";
import { RecipeModel } from "../../../Models/RecipeModel";

export function HomeScreen() {
  useTitle("Home");

  const { items } = useSelector((state: AppState) => state.recipes);
  const suggestedRecipeItem = useSelector((state: AppState) => state.recipes.dailyRecipes);

  const current = useSelector((s: AppState) => s.recipes.current);
  const user = useSelector((state: AppState) => state.user);

  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");

  const [open, setOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);

  // ✅ minimal: keep guest filters so restored guest recipe can render again
  const [guestFiltersStash, setGuestFiltersStash] = useState<Filters | null>(null);

  useEffect(() => {
    setShowSuggestions(!user);
  }, [user]);

  useEffect(() => {
    suggestionsService.getToday().catch(notify.error);
  }, []);

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

  const showingSuggestions = !user || showSuggestions;
  const activeList = showingSuggestions ? suggestionsList : recentlyViewedList;

  async function loadImage(recipeToLoad: RecipeModel): Promise<RecipeModel> {
    let updated: RecipeModel;

    if (recipeToLoad.id) {
      updated = await recipeService.generateImageForSavedRecipe(recipeToLoad.id);
    } else {
      const preview = await recipeService.generateImagePreview(recipeToLoad);
      updated = {
        ...recipeToLoad,
        imageUrl: preview.imageUrl,
        imageName: preview.imageName ?? recipeToLoad.imageName ?? null,
      };
    }

    dispatch(setCurrent(updated));
    return updated;
  }

  const filtersToUse: Filters | null = appliedFilters ?? guestFiltersStash;

  const handleExitRecipe = () => {
    // ✅ guest: stash recipe + stash filters before clearing
    if (!user && current?.title) {
      dispatch(stashGuestRecipe(current));
      if (filtersToUse) setGuestFiltersStash(filtersToUse);
    }

    dispatch(resetGenerated());
    setAppliedFilters(null);
  };

  return (
    <div className={`HomeScreen ${user ? "user" : "guest"}`}>
      <div className={`HomeScreenTitleWrapper ${isRTL ? "rtl" : "ltr"}`}>
        {!user && (
          <div>
            <h2 className="GuestTitle">{t("homeScreen.generate")}</h2>
            <p className="GuestTitle2">{t("homeScreen.generate2")}</p>
          </div>
        )}

        <div className="SelectionDiv">
          <Button
            className="GenerateRecipeBtnHomeScreen"
            onClick={() => {
              dispatch(resetGenerated());
              setAppliedFilters(null);
              setOpen(true);
            }}
            variant="contained"
          >
            {t("homeScreen.generate")}
            <AutoAwesome />
          </Button>

          <Dialog
          className="generate_dialog_root"
            PaperProps={{ className: "generate_dialog_paper" }}
            open={open}
            onClose={() => setOpen(false)}
          >
            <RecipeInputDialog
              onDone={() => setOpen(false)}
              onFiltersReady={setAppliedFilters}
            />
          </Dialog>

          {current?.title && filtersToUse && !open && (
            <div className="RecipeCardContainer">
              <RecipeDataContainer
                recipe={current}
                filters={filtersToUse}
                loadImage={loadImage}
                onExitRecipe={handleExitRecipe}
              />
            </div>
          )}

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
            <h3 className="HomeScreenTitle user">{t("homeScreen.suggestions") || "Suggestions"}</h3>
          ) : recentlyViewedList.length === 0 ? (
            <div className="HomeScreenTitleContainer">
              <h3 className="HomeScreenTitle user">{t("homeScreen.noRecipes")}</h3>
            </div>
          ) : (
            <h3 className="HomeScreenTitle user">{t("homeScreen.recentlyViewed")}</h3>
          )}

          <div className="RecipeGrid">
            {activeList.map((recipe) => (
              <RecipeListItem
                key={recipe.id ?? recipe.title}
                recipe={recipe}
                context={showingSuggestions ? "suggestions" : "default"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
