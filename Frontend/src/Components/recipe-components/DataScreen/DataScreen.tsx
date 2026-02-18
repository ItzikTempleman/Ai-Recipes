import "./DataScreen.css";
import "./SneakPeak.css";
import { formatAmount } from "../../../Utils/Utils";
import { Filters } from "../RecipeDataContainer/RecipeDataContainer";
import chef from "../../../Assets/images/chef.png";
import { FilterBadges } from "../FilterBadges/FilterBadges";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { RecipeModel } from "../../../Models/RecipeModel";
import CameraEnhanceIcon from '@mui/icons-material/CameraEnhance';
import { Box, Button, CircularProgress, IconButton } from "@mui/material";
import { notify } from "../../../Utils/Notify";
import ReplyIcon from "@mui/icons-material/Reply";
import { shareRecipeAsPdfWithToasts } from "../../../Services/ShareRecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { AskChefDialog } from "../AskChefDialog/AskChefDialog";
import { normalizedIngredients, normalizeIngredientRow } from "../../../Utils/NormalizedIngredients";
import { useNavigate } from "react-router-dom";

type RecipeProps = {
  recipe: RecipeModel;
  imageSrc: string;
  filters?: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
  shareMode?: boolean;
  onExitRecipe?: () => void;
};

export function DataScreen({ recipe, imageSrc, filters, loadImage, shareMode, onExitRecipe }: RecipeProps) {
  const { t, i18n } = useTranslation();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const shareOnceRef = useRef(false);

  const isRTL = (i18n.language ?? "").startsWith("he");
  const hasHebrew = (s: unknown) => /[\u0590-\u05FF]/.test(String(s ?? ""));
  const navigate = useNavigate();

  const [localImgSrc, setLocalImgSrc] = useState(imageSrc);

  const ingredients = recipe.data?.ingredients ?? [];
  const ingredientsModified = normalizedIngredients(ingredients);

  const instructions = recipe.data?.instructions ?? [];

  const recipeIsHebrew =
    hasHebrew(recipe.title) ||
    hasHebrew(recipe.description) ||
    ingredients.some((x: any) => hasHebrew(x?.ingredient ?? x)) ||
    instructions.some((x: any) => hasHebrew(x));

  const headingLng: "he" | "en" = recipeIsHebrew ? "he" : "en";
  const headingDir: "rtl" | "ltr" = recipeIsHebrew ? "rtl" : "ltr";
  const layoutDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";

  const [open, setOpen] = useState(false);
  const user = useSelector((state: AppState) => state.user);

  const handleToggleAsk = (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleCloseAskChef = () => {
    setOpen(false);
  };

  const handleLoadImage = async () => {
    try {
      if (!loadImage || isImageLoading) return;
      setIsImageLoading(true);

      const updated = await loadImage(recipe);
      const url = (updated.imageUrl ?? "").trim();

      setLocalImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
    } catch (err) {
      notify.error(err);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleShare = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    if (shareOnceRef.current) return;

    shareOnceRef.current = true;

    try {
      await shareRecipeAsPdfWithToasts({
        ...recipe,
        imageUrl: (localImgSrc ?? "").trim() || (recipe as any)?.imageUrl || "",
      });
    } catch (err: any) {
      notify.error(err?.message || String(err));
    } finally {
      setTimeout(() => {
        shareOnceRef.current = false;
      }, 2500);
    }
  };

  useEffect(() => {
    const url = (imageSrc ?? "").trim();
    setLocalImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [imageSrc]);

  useEffect(() => {
    if (!shareMode) return;
    (window as any).__SHARE_READY__ = false;

    const raf = requestAnimationFrame(() => {
      const img = document.querySelector<HTMLImageElement>("#share-root img.RecipeImage");

      if (img && !img.complete) {
        img.onload = () => ((window as any).__SHARE_READY__ = true);
        img.onerror = () => ((window as any).__SHARE_READY__ = true);
        return;
      }

      (window as any).__SHARE_READY__ = true;
    });

    return () => cancelAnimationFrame(raf);
  }, [shareMode, localImgSrc, recipe]);

  return (
    <div className="DataScreen" dir={isRTL ? "rtl" : "ltr"}>
      <div className="RecipeTopSection">
        <div className={`TopActions ${isRTL ? "rtl" : "ltr"}`}>
          <Button className={`ShareBtnContainer ${isRTL ? "rtl" : "ltr"}`} variant="contained" onClick={handleShare}>
            <ReplyIcon />
            {t("recipeUi.share")}
          </Button>
        </div>

        <div
          className={`ClearFormDiv ${isRTL ? "rtl" : "ltr"}`}
          onClick={() => {
            onExitRecipe?.();
            navigate("/home");
          }}
        >
          ❌
        </div>

        <h2 className={`RecipeTitle ${headingDir}`} dir={headingDir} lang={headingLng}>
          {recipe.title}
        </h2>

        <p className={`Description ${headingDir}`} dir={headingDir} lang={headingLng}>
          {recipe.description}
        </p>

        <FilterBadges filters={filters} isRTL={isRTL} />

        <div className="RecipeSneakPeakInfo" dir={isRTL ? "rtl" : "ltr"}>
          <div className="Calories">
            <p className="Title">{t("recipeUi.calories")}</p>
            {isRTL ? (
              <p className="StatLine">
                <span className="StatNum BidiIso">{recipe.calories}</span>
                <span className="StatText"> קק״ל ל־</span>
                <span className="BidiIso">100</span>
                <span className="StatText"> גרם</span>
              </p>
            ) : (
              <p className="StatLine">
                {recipe.calories} {t("recipeUi.kcal")}
              </p>
            )}
          </div>

          <div className="Sugar">
            <p className="Title">{t("recipeUi.sugar")}</p>
            {Number(recipe.totalSugar) === 0 ? (
              <p className="StatLine">0</p>
            ) : isRTL ? (
              <p className="StatLine">
                <span className="StatNum BidiIso">{recipe.totalSugar}</span>
                <span className="StatText"> כפיות ל־</span>
                <span className="BidiIso">100</span>
                <span className="StatText"> גרם</span>
              </p>
            ) : (
              <p className="StatLine">{recipe.totalSugar} table spoons in 100 grams</p>
            )}
          </div>

          <div className="Protein">
            <p className="Title">{t("recipeUi.protein")}</p>
            {isRTL ? (
              <p className="StatLine">
                <span className="StatNum BidiIso">{recipe.totalProtein}</span>
                <span className="StatText"> גרם חלבון ל־</span>
                <span className="BidiIso">100</span>
                <span className="StatText"> גרם</span>
              </p>
            ) : (
              <p className="StatLine">
                {recipe.totalProtein} grams <br />
                in 100 grams
              </p>
            )}
          </div>

          <div className="Quantity">
            <p className="Title">{t("recipeUi.time")}</p>
            <p className="StatLine">
              <span className="StatNum BidiIso">{recipe.prepTime}</span>{" "}
              <span className="StatText">{t("units.minuteShort")}</span>
            </p>
          </div>
        </div>

        {user && (
          <div className={`AskModelDiv ${isRTL ? "rtl" : "ltr"}`} onClick={handleToggleAsk}>
            <img className="ChefImage" src={chef} />
            <h4>{t("recipeUi.ask")}</h4>
          </div>
        )}

        <AskChefDialog open={open} onClose={handleCloseAskChef} recipe={recipe} isRTL={isRTL} />

        {localImgSrc ? (
          <img className="RecipeImage" src={localImgSrc} onError={() => setLocalImgSrc("")} />
        ) : (
          loadImage &&
          (isImageLoading ? (
            <>
              <h2 className="ImageLoadingMessageAfterRecipeGenerated">
                {t("generate.loadingWithImage")} {t("generate.loadingWithImageLowerMessage")}
              </h2>
              <IconButton className="ProgressBar" edge="end" disabled>
                <Box>
                  <CircularProgress />
                </Box>
              </IconButton>
            </>
          ) : (
            !shareMode && (
              <Button className="GenerateRecipeBtnHomeScreen" variant="contained" onClick={handleLoadImage}>
                <CameraEnhanceIcon />
                {t("recipeUi.loadImage")}
              </Button>
            )
          ))
        )}
      </div>

      <div className="RecipePreparationWideView">
        <div className={`RecipeStepsGrid ${isRTL ? "rtl" : "ltr"}`}>
          <div className={`IngredientsList ${layoutDir}`} dir={layoutDir}>
            <h2 className={`IngredientsTitle ${layoutDir}`} dir={layoutDir}>
              {t("recipeUi.ingredients")}
            </h2>

            {ingredientsModified.map((line, index) => {
              const { ingredient, amount } = normalizeIngredientRow(line);
              return (
                <div key={index} className="IngredientRow">
                  <span className="IngredientName">{ingredient}</span>
                  <span className="IngredientAmount">{formatAmount(amount) ?? ""}</span>
                </div>
              );
            })}
          </div>

          <div className={`InstructionsList ${layoutDir}`} dir={layoutDir}>
            <h2 className={`InstructionsTitle ${layoutDir}`} dir={layoutDir}>
              {t("recipeUi.instructions")}
            </h2>

            <ol className={`InstructionsListOl ${headingDir}`} dir={headingDir}>
              {instructions
                .map((s) => String(s ?? "").trim())
                .filter((s) => s.length > 0)
                .map((step, index) => (
                  <li className="InstructionLi" key={index}>
                    {step}
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
