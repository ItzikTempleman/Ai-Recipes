import "./DataScreen.css";
import { formatAmount } from "../../../Utils/Utils";
import { flagEmojiToTwemojiUrl, getCountryFlag } from "../../../Utils/CountryFlag";
import { Filters } from "../RecipeCard/RecipeCard";
import chef from "../../../Assets/images/chef.png";
import { FilterBadges } from "../../../Utils/FilterBadges";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { RecipeModel } from "../../../Models/RecipeModel";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import { Box, Button, CircularProgress, IconButton } from "@mui/material";
import { notify } from "../../../Utils/Notify";
import IosShareIcon from "@mui/icons-material/IosShare";
import { shareRecipeAsPdfWithToasts } from "../../../Services/ShareRecipeService";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { AskChefDialog } from "../AskChefDialog/AskChefDialog";
import { normalizedIngredients } from "../../../Utils/NormalizedIngredients";

type RecipeProps = {
  recipe: RecipeModel;
  imageSrc: string;
  filters?: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
  shareMode?: boolean;
};

export function DataScreen({ recipe, imageSrc, filters, loadImage, shareMode }: RecipeProps) {
  const { t, i18n } = useTranslation();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const shareOnceRef = useRef(false);
  const isRTL = (i18n.language ?? "").startsWith("he");
  const hasHebrew = (s: unknown) => /[\u0590-\u05FF]/.test(String(s ?? ""));
  const [localImgSrc, setLocalImgSrc] = useState(imageSrc);
  const ingredients = recipe.data?.ingredients ?? [];
  const ingredientsModified = normalizedIngredients(ingredients)
  const instructions = recipe.data?.instructions ?? [];
  const recipeIsHebrew =hasHebrew(recipe.title) ||hasHebrew(recipe.description) ||ingredients.some((x: any) => hasHebrew(x?.ingredient ?? x)) ||instructions.some((x: any) => hasHebrew(x));
  const headingLng: "he" | "en" = recipeIsHebrew ? "he" : "en";
  const headingDir: "rtl" | "ltr" = recipeIsHebrew ? "rtl" : "ltr";
  const layoutDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";
  const flag = getCountryFlag(recipe.countryOfOrigin);
  const [open, setOpen] = useState(false);
  const user = useSelector((state: AppState) => state.user);

  const handleToggleAsk = (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    setOpen(prev => !prev);
  };

  const handleClose = () => setOpen(false);

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

  function normalizeIngredientRow(row: any) {
    const ingredient = String(row?.ingredient ?? "").trim();
    let amount = row?.amount == null ? "" : String(row.amount).trim();
    if (!ingredient || !amount) return { ingredient, amount };

    const escaped = ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    amount = amount.replace(re, "").replace(/\s{2,}/g, " ").trim();
    return { ingredient, amount };
  }

  return (
    <div className="DataScreen">
      <div className="RecipeHeaderRow">
        {!shareMode && (
          <Button
            className={`ShareBtnContainer ${isRTL ? "rtl" : "ltr"}`}
            variant="contained"
            onClick={handleShare}
          >
            <IosShareIcon />
            {t("recipeUi.share")}
          </Button>
        )}

        <h2
        className={`RecipeTitle ${headingDir}`}
          dir={headingDir}
        lang={headingLng}
        >
          {recipe.title}
        </h2>
      </div>

      <p
        className={`Description ${headingDir}`}
        dir={headingDir}
        lang={headingLng}
      >
        {recipe.description}
      </p>

      {localImgSrc ?  (
        <img className="RecipeImage" src={localImgSrc} onError={() => setLocalImgSrc("")} />
      ) : loadImage && (
        isImageLoading ? (
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
            <Button className="LoadImageBtn" variant="contained" onClick={handleLoadImage}>
              <ImageSearchIcon />
              {t("recipeUi.loadImage")}
            </Button>
          )
        )
      )}

      <FilterBadges filters={filters} isRTL={isRTL} />

      <div className="RecipeSneakPeakInfo">
        <div className="Calories">
          <p className="Title">{t("recipeUi.calories")}</p>

          {isRTL ? (
            <div className="CaloriesInnerText">
              <p> ק ל100 גרם</p> <p>{recipe.calories}</p>
            </div>
          ) : (
            <div>
              <p>
                {recipe.calories} {t("recipeUi.kcal")}
              </p>
            </div>
          )}
        </div>

        <div className="Sugar">
          <p className="Title">{t("recipeUi.sugar")}</p>
          {Number(recipe.totalSugar) === 0 ? (
            <p>0</p>
          ) : isRTL ? (
            <div>
              <p> כפיות ל100 גרם </p> <p> {recipe.totalSugar}</p>
            </div>
          ) : (
            <div>
              <p>{recipe.totalSugar} table spoons (per 100 grams)</p>
            </div>
          )}
        </div>

        <div className="Protein">
          <p className="Title">{t("recipeUi.protein")}</p>
          {isRTL ? (
            <div className="ProteinInnerText">
              <p> גרם ל100 גרם מאכל </p> <p> {recipe.totalProtein}</p>
            </div>
          ) : (
            <div>
              <p>{recipe.totalProtein} grams (per 100 grams)</p>
            </div>
          )}
        </div>

        <div className="Quantity">
          <p className="Title">{t("recipeUi.time")}</p>
          <p>
            {recipe.prepTime} {t("units.minuteShort")}{" "}
          </p>
        </div>

        <div className="Country">
          <p className="Title">{recipe.countryOfOrigin}</p>
          {shareMode && flag ? (
            <img className="CountryFlagImg" src={flagEmojiToTwemojiUrl(flag)} />
          ) : (
            <span className="CountryFlag">{flag}</span>
          )}
        </div>
      </div>

      {user && (
        <div className={`AskModelDiv ${isRTL ? "rtl" : "ltr"}`} onClick={handleToggleAsk}>
          <img className="ChefImage" src={chef} />
          <h4>{t("recipeUi.ask")}</h4>
        </div>
      )}

      <AskChefDialog open={open} onClose={handleClose} recipe={recipe} isRTL={isRTL} />

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
                .map((step, index, arr) => (
                  <li className="InstructionLi" key={index}>
                    {step}
                    {index !== arr.length - 1}
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}