import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Chip, Dialog } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./HomeScreen.css";
import { useTitle } from "../../Utils/Utils";
import { AppState } from "../../Redux/Store";
import { recipeService } from "../../Services/RecipeService";
import { RecipeListItem } from "../RecipeComponents/RecipeListItem/RecipeListItem";
import { notify } from "../../Utils/Notify";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { RecipeInputDialog } from "../RecipeComponents/RecipeInputDialog/RecipeInputDialog";
import { resetGenerated, setCurrent, stashGuestRecipe } from "../../Redux/RecipeSlice";
import { Filters, RecipeDataContainer } from "../RecipeComponents/RecipeDataContainer/RecipeDataContainer";
import { RecipeCategory, RecipeModel } from "../../Models/RecipeModel";
 import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
 import ArrowBackIcon from '@mui/icons-material/ArrowBack';


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

function normalizeCategories(input: unknown): RecipeCategory[] {
  if (Array.isArray(input)) return input as RecipeCategory[];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? (parsed as RecipeCategory[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function HomeScreen() {
  useTitle("Home");

  const { items, catalogItems } = useSelector((state: AppState) => state.recipes);
  const current = useSelector((s: AppState) => s.recipes.current);
  const user = useSelector((state: AppState) => state.user);
  const likes = useSelector((state: AppState) => state.likes);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");
  
  const shouldOpenGenerate = searchParams.get("generate") === "1";
  const [open, setOpen] = useState(shouldOpenGenerate);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [listState, setListState] = useState<ListState>(ListState.SUGGESTIONS);
  const [guestFiltersStash, setGuestFiltersStash] = useState<Filters | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<RecipeCategory[]>([]);

  useEffect(() => {
    setOpen(shouldOpenGenerate);
  }, [shouldOpenGenerate]);

  useEffect(() => {
    setListState(ListState.SUGGESTIONS);
  }, [user?.id]);

  useEffect(() => {
    recipeService.getAllRecipes().catch(notify.error);
  }, [i18n.language]);

  useEffect(() => {
    if (!user?.id) return;
    recipeService.getMyRecipes().catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (listState !== ListState.FAVORITES) return;

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
    const list = Array.isArray(catalogItems) ? catalogItems : [];

    if (selectedCategories.length === 0) return list;

    const selected = new Set(selectedCategories);
    return list.filter((r) => {
      const cats = normalizeCategories((r as any).categories);
      return cats.some((c) => selected.has(c));
    });
  }, [catalogItems, selectedCategories]);

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
        imageName: preview.imageName ?? recipeToLoad.imageName ?? null
      };
    }

    dispatch(setCurrent(updated));
    return updated;
  }

  const filtersToUse: Filters | null = appliedFilters ?? guestFiltersStash;

  const openGenerateDialog = () => {
    dispatch(resetGenerated());
    setAppliedFilters(null);

    const next = new URLSearchParams(searchParams);
    next.set("generate", "1");
    setSearchParams(next);
  };

  const closeGenerateDialog = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("generate");
    setSearchParams(next);
  };

  const handleExitRecipe = () => {
    if (!user && current?.title) {
      dispatch(stashGuestRecipe(current));
      if (filtersToUse) setGuestFiltersStash(filtersToUse);
    }

    dispatch(resetGenerated());
    setAppliedFilters(null);
  };

  const featuredFallback = isRTL ? "המלצות" : "Featured";

  const titleText = useMemo(() => {
    const featured = t("homeScreen.suggestions") || featuredFallback;

    if (!user) return featured;

    if (listState === ListState.SUGGESTIONS) return featured;
    if (listState === ListState.RECENTLY_VIEWED) return t("homeScreen.recentlyViewed") || "Recently viewed";
    return t("likeScreen.likedTitle") || t("likeScreen.noLikes");
  }, [user, listState, t, featuredFallback]);

  const toggleCategory = (c: RecipeCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      return [...prev, c];
    });
  };

  return (
    <div className={`HomeScreen ${user ? "user" : "guest"}`}>
      <div className={`home-screen-wrapper ${isRTL ? "rtl" : "ltr"}`}>
        <div>
          <h2 className="main-title">{t("homeScreen.generateTitle")}</h2>
        </div>

        <div className="SelectionDiv">
             <div className="FeatureHint">
        {!user && (
          <Button
            className="free-with-login-btn"
            onClick={() => navigate("/login")}>
            <p>{t("homeScreen.ask")}</p>
            <p>{t("homeScreen.save")}</p>
            <p>{t("homeScreen.history")}</p>
             {
              !isRTL? <ArrowForwardIcon/> :<ArrowBackIcon/>
            }
          </Button>
        )}
      </div>

          <Button
            className="home-screen-generate-btn"
            onClick={openGenerateDialog}
            variant="contained">
            {t("homeScreen.generate")}
            <AutoAwesome />
          </Button>

          <Dialog
            className="generate_dialog_root"
            PaperProps={{ className: "generate_dialog_paper" }}
            open={open}
            onClose={closeGenerateDialog}
          >
            <RecipeInputDialog
              onDone={() => {
                closeGenerateDialog();
                navigate("/home", { replace: true });
              }}
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
                className={`SuggestionsBtn ${listState === ListState.SUGGESTIONS ? "active" : ""}`}
                onClick={() => setListState(ListState.SUGGESTIONS)}
                role="button"
                tabIndex={0}
              >
                <h4>{t("homeScreen.suggestions") || featuredFallback}</h4>
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

          {!user && (
            <div className={`SelectListDiv ${isRTL ? "rtl" : "ltr"}`}>
              <div className="SuggestionsBtn active" role="presentation">
                <h4>{titleText}</h4>
              </div>
            </div>
          )}

          {listState === ListState.SUGGESTIONS && (
            <div className="CategoryChipsContainer">
              {ALL_CATEGORIES.map((c) => (
                <Chip
                  className={`Chip ${selectedCategories.includes(c) ? "selected" : ""}`}
                  key={c}
                  label={t(`categories.${c}`) || c}
                  clickable
                  onClick={() => toggleCategory(c)}
                />
              ))}

              {selectedCategories.length > 0 && (
                <Chip
                  className="CategoryChipClear"
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