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


enum ListState {
  SUGGESTIONS, RECENTLY_VIEWED, FAVORITES
}

export function HomeScreen() {
  useTitle("Home");

  const { items } = useSelector((state: AppState) => state.recipes);
  const suggestedRecipeItem = useSelector((state: AppState) => state.recipes.dailyRecipes);

  const current = useSelector((s: AppState) => s.recipes.current);
  const user = useSelector((state: AppState) => state.user);
const likes = useSelector((state: AppState) => state.likes);

  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");

  const [open, setOpen] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
const [listState, setListState] = useState<ListState>(ListState.SUGGESTIONS);
  
  const [guestFiltersStash, setGuestFiltersStash] = useState<Filters | null>(null);

   useEffect(() => {
    if (!user) {
     
      setListState(ListState.SUGGESTIONS);
    } else {
      setListState(ListState.RECENTLY_VIEWED);
    }
  }, [user?.id]);


  useEffect(() => {
    suggestionsService.getToday().catch(notify.error);
  }, []);

  const token = localStorage.getItem("token");



  useEffect(() => {
    if (!token) return;
    recipeService.getAllRecipes().catch(notify.error);
  }, [token]);

    useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user?.id) return;
    if (listState !== ListState.FAVORITES) return;

    if (!Array.isArray(items) || items.length === 0) {
      recipeService.getAllRecipes().catch(() => {});
    }
    recipeService.loadMyLikes().catch(() => {});
  }, [listState, user?.id]);

  const recentlyViewedList = useMemo(() => (Array.isArray(items) ?[...items].reverse() : []), [items]);
  const suggestionsList = useMemo(
    () => (Array.isArray(suggestedRecipeItem) ? suggestedRecipeItem : []),
    [suggestedRecipeItem]
  );

  const likedList = useMemo(() => {
    if (!user?.id) return [];
    const list = Array.isArray(items) ? items : [];
    const userId = user.id;

    const likedIds = new Set(
      likes
        .filter((l) => l.userId === userId)
        .map((l) => l.recipeId)
        .filter((id) => id != null)
    );

    return list.filter((r) => r.id != null && likedIds.has(r.id));
  }, [likes, items, user?.id]);

    const activeList = useMemo(() => {
    if (!user) return suggestionsList;

    switch (listState) {
      case ListState.SUGGESTIONS:
        return suggestionsList;
      case ListState.RECENTLY_VIEWED:
        return recentlyViewedList;
      case ListState.FAVORITES:
        return likedList;
      default:
        return suggestionsList;
    }
  }, [user, listState, suggestionsList, recentlyViewedList, likedList]);


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
    if (!user && current?.title) {
      dispatch(stashGuestRecipe(current));
      if (filtersToUse) setGuestFiltersStash(filtersToUse);
    }

    dispatch(resetGenerated());
    setAppliedFilters(null);
  };

    const titleText = useMemo(() => {
    if (!user) return t("homeScreen.suggestions") || "Suggestions";

    if (listState === ListState.SUGGESTIONS) return t("homeScreen.suggestions") || "Suggestions";
    if (listState === ListState.RECENTLY_VIEWED) return t("homeScreen.recentlyViewed") || "Recently viewed";
    return t("likeScreen.likedTitle") || t("nav.likes") || "Likes";
  }, [user, listState, t]);

  
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
                className={`RecentlyViewedBtn ${listState === ListState.RECENTLY_VIEWED ? "active" : ""}`}
                onClick={() => setListState(ListState.RECENTLY_VIEWED)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("homeScreen.history")}</h4>
              </div>

              <div
                className={`SuggestionsBtn ${listState === ListState.SUGGESTIONS ? "active" : ""}`}
            onClick={() => setListState(ListState.SUGGESTIONS)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("homeScreen.suggestions2")}</h4>
              </div>

              <div
                className={`LikeBtn ${listState === ListState.FAVORITES ? "active" : ""}`}
            onClick={() => setListState(ListState.FAVORITES)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("nav.likes")}</h4>
              </div>

            </div>
          )}

      {user && listState === ListState.RECENTLY_VIEWED && recentlyViewedList.length === 0 ? (
            <div className="HomeScreenTitleContainer">
              <h3 className="HomeScreenTitle user">{t("homeScreen.noRecipes")}</h3>
            </div>
          ) : user && listState === ListState.FAVORITES && likedList.length === 0 ? (
            <div className="HomeScreenTitleContainer">
              <h3 className="HomeScreenTitle user">{t("likeScreen.noLikes") || t("homeScreen.noRecipes")}</h3>
            </div>
          ) : (
            <h3 className="HomeScreenTitle user">{titleText}</h3>
          )}

          <div className="RecipeGrid">
            {activeList.map((recipe) => (
              <RecipeListItem
                key={recipe.id ?? recipe.title}
                recipe={recipe}
             context={user && listState === ListState.SUGGESTIONS ? "suggestions" : "default"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
