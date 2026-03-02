import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Chip, Dialog } from "@mui/material";
import "./HomeScreen.css";
import { useTitle } from "../../../Utils/Utils";
import { AppState } from "../../../Redux/Store";
import { recipeService } from "../../../Services/RecipeService";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import { notify } from "../../../Utils/Notify";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { RecipeInputDialog } from "../RecipeInputDialog/RecipeInputDialog";
import { resetGenerated, setCurrent, stashGuestRecipe } from "../../../Redux/RecipeSlice";
import { Filters, RecipeDataContainer } from "../RecipeDataContainer/RecipeDataContainer";
import { RecipeCategory, RecipeModel } from "../../../Models/RecipeModel";
import { FeatureHint } from "../FeatureHint/FeatureHint";

enum ListState {
  SUGGESTIONS,
  RECENTLY_VIEWED,
  FAVORITES
}

const ALL_CATEGORIES: RecipeCategory[] = [
  RecipeCategory.breakfast,
  RecipeCategory.lunch,
  RecipeCategory.supper,
  RecipeCategory.deserts,
  RecipeCategory.dairy,
  RecipeCategory.vegan,
  RecipeCategory.fish,
  RecipeCategory.meat
];

export function HomeScreen() {
  useTitle("Home");

  const { items } = useSelector((state: AppState) => state.recipes);
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

  // Category filtering replaces "Suggested Today"
  const [selectedCategories, setSelectedCategories] = useState<RecipeCategory[]>([]);

  useEffect(() => {
    if (!user) {
      setListState(ListState.SUGGESTIONS);
    } else {
      setListState(ListState.RECENTLY_VIEWED);
    }
  }, [user?.id]);

  // Load catalog recipes for current language (public endpoint; returns 50 based on app language)
  useEffect(() => {
    recipeService.getAllRecipes().catch(notify.error);
  }, [i18n.language]);

  useEffect(() => {
    // Favorites view still needs likes; keep behavior as close as possible
    if (!user?.id) return;
    if (listState !== ListState.FAVORITES) return;

    // Ensure catalog is present for mapping liked ids to recipes
    if (!Array.isArray(items) || items.length === 0) {
      recipeService.getAllRecipes().catch(() => {});
    }
    recipeService.loadMyLikes().catch(() => {});
  }, [listState, user?.id]);

  const recentlyViewedList = useMemo(
    () => (Array.isArray(items) ? [...items].reverse() : []),
    [items]
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

  const baseSuggestionsList = useMemo(() => {
    const list = Array.isArray(items) ? items : [];

    if (selectedCategories.length === 0) return list;

    const selected = new Set(selectedCategories);
    return list.filter((r) => {
      const cats = (r.categories ?? []) as unknown as RecipeCategory[];
      return Array.isArray(cats) && cats.some((c) => selected.has(c));
    });
  }, [items, selectedCategories]);

  const suggestionsList = useMemo(() => baseSuggestionsList, [baseSuggestionsList]);

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
    return t("likeScreen.likedTitle") || t("likeScreen.noLikes");
  }, [user, listState, t]);

  const toggleCategory = (c: RecipeCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      return [...prev, c];
    });
  };

  return (
    <div className={`HomeScreen ${user ? "user" : "guest"}`}>
      <div className={`HomeScreenTitleWrapper ${isRTL ? "rtl" : "ltr"}`}>
        {!user && (
          <div className={`GuestHeader ${isRTL ? "rtl" : "ltr"}`}>
            <div className={`HelloGuestMessage ${isRTL ? "rtl" : "ltr"}`}>
              <p>{t("generate.guest")}</p>
            </div>

            <div>
              <h2 className="GuestTitle">{t("homeScreen.generateTitle")}</h2>
              <p className="GuestTitle2">{t("homeScreen.generate2")}</p>
            </div>
          </div>
        )}

        <div className="SelectionDiv">
          <FeatureHint />
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
            <RecipeInputDialog onDone={() => setOpen(false)} onFiltersReady={setAppliedFilters} />
          </Dialog>

          {current?.title && filtersToUse && !open && (
            <div className="RecipeCardContainer">
              <RecipeDataContainer recipe={current} filters={filtersToUse} loadImage={loadImage} onExitRecipe={handleExitRecipe} />
            </div>
          )}

          {user && (
            <div className={`SelectListDiv ${isRTL ? "rtl" : "ltr"}`}>
              <div
                className={`SuggestionsBtn ${listState === ListState.SUGGESTIONS ? "active" : ""}`}
                onClick={() => setListState(ListState.SUGGESTIONS)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("homeScreen.suggestions")}</h4>
              </div>

              <div
                className={`RecentlyViewedBtn ${listState === ListState.RECENTLY_VIEWED ? "active" : ""}`}
                onClick={() => setListState(ListState.RECENTLY_VIEWED)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("homeScreen.recentlyViewed")}</h4>
              </div>
              <div
                className={`LikeBtn ${listState === ListState.FAVORITES ? "active" : ""}`}
                onClick={() => setListState(ListState.FAVORITES)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("likeScreen.likedTitle")}</h4>
              </div>
            </div>
          )}

          {!user && <h3 className="HomeScreenTitle user">{titleText}</h3>}


  {listState === ListState.SUGGESTIONS && (
  <div className="CategoryChipsContainer">
    {ALL_CATEGORIES.map((c) => (
      <Chip
        key={c}
        label={t(`categories.${c}`) || c}
        clickable
        color={selectedCategories.includes(c) ? "primary" : "default"}
        onClick={() => toggleCategory(c)}
      />
    ))}
    {selectedCategories.length > 0 && (
      <Chip className="CategoryChipClear"
        label={t("categories.clear") || "Clear"}
        clickable
        onClick={() => setSelectedCategories([])}
      />
    )}
  </div>
)}

          <div className="RecipeGrid">
            {activeList.map((recipe) => (
              <RecipeListItem
                key={recipe.id ?? recipe.title}
                recipe={recipe}
                context={
                  !user
                    ? "suggestions"
                    : listState === ListState.SUGGESTIONS
                    ? "suggestions"
                    : listState === ListState.FAVORITES
                    ? "likes"
                    : "default"
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
