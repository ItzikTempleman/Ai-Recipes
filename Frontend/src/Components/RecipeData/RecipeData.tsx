import "./RecipeData.css";
import { formatAmount, getDifficultyLevel } from "../../Utils/Utils";
import { flagEmojiToTwemojiUrl, getCountryFlag } from "../../Utils/CountryFlag";
import { Filters } from "../RecipeCard/RecipeCard";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { FilterBadges } from "../Filters/FilterBadges";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { RecipeModel } from "../../Models/RecipeModel";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import { Box, Button, CircularProgress, IconButton } from "@mui/material";
import { notify } from "../../Utils/Notify";
import IosShareIcon from "@mui/icons-material/IosShare";
import { shareRecipeAsPdfWithToasts } from "../../Services/ShareRecipeService";

type RecipeProps = {
  recipe: RecipeModel;
  imageSrc: string;
  filters?: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
  shareMode?: boolean;
};

export function RecipeData({ recipe, imageSrc, filters, loadImage, shareMode }: RecipeProps) {
  const { t, i18n } = useTranslation();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const shareOnceRef = useRef(false);

  // ✅ only change: compute RTL directly from i18n
  const isRTL = (i18n.language ?? "").startsWith("he");

  const hasHebrew = (s: unknown) => /[\u0590-\u05FF]/.test(String(s ?? ""));
  const [localImgSrc, setLocalImgSrc] = useState(imageSrc);

  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];

  const recipeIsHebrew =
    hasHebrew(recipe.title) ||
    hasHebrew(recipe.description) ||
    ingredients.some((x: any) => hasHebrew(x?.ingredient ?? x)) ||
    instructions.some((x: any) => hasHebrew(x));

  const headingLng: "he" | "en" = recipeIsHebrew ? "he" : "en";
  const headingDir: "rtl" | "ltr" = recipeIsHebrew ? "rtl" : "ltr";
  const flag = getCountryFlag(recipe.countryOfOrigin);

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
      await shareRecipeAsPdfWithToasts(recipe);
    } catch (err: any) {
      notify.error(err?.message || String(err));
    } finally {
      setTimeout(() => {
        shareOnceRef.current = false;
      }, 2500);
    }
  };

  const difficulty = getDifficultyLevel(recipe.difficultyLevel);

  function normalizeIngredientRow(row: any) {
    const ingredient = String(row?.ingredient ?? "").trim();
    let amount = row?.amount == null ? "" : String(row.amount).trim();

    if (!ingredient || !amount) return { ingredient, amount };

    const escaped = ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");

    amount = amount.replace(re, "").replace(/\s{2,}/g, " ").trim();

    return { ingredient, amount };
  }

  const normalizedIngredients = (() => {
    const out: typeof ingredients = [];

    const isModifierLine = (text: string) =>
      /^(finely|roughly|coarsely|thinly|freshly|cut|sliced|diced|minced|chopped|grated|shredded|cubed|peeled|crushed)\b/i.test(
        text.trim()
      );

    const appendToPrev = (suffix: string) => {
      if (out.length === 0) return;
      const prev = out[out.length - 1] as any;
      const prevText = String(prev.ingredient ?? "").trim();
      const add = suffix.trim();
      if (!add) return;

      const lastPart = prevText.split(",").pop()?.trim().toLowerCase();
      if (lastPart === add.toLowerCase()) return;

      const parts = prevText.split(",").map((p: string) => p.trim().toLowerCase());
      if (parts.includes(add.toLowerCase())) return;

      prev.ingredient = `${prevText}, ${add}`;
    };

    for (const line of ingredients) {
      const ingredientText = String((line as any)?.ingredient ?? "").trim();
      const rawAmount = (line as any)?.amount;
      const amountText =
        rawAmount === null || rawAmount === undefined ? "" : String(rawAmount).trim();

      if (!ingredientText) continue;

      if (!amountText && isModifierLine(ingredientText)) {
        appendToPrev(ingredientText);
        continue;
      }

      out.push(line);
    }

    return out;
  })();

  return (
    <div className="RecipeData">
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
          className={`RecipeTitle ${shareMode ? headingDir : isRTL ? "rtl" : "ltr"}`}
          dir={shareMode ? headingDir : isRTL ? "rtl" : "ltr"}
          lang={shareMode ? headingLng : undefined}
        >
          {recipe.title}
        </h2>
      </div>

      <p
        className={`Description ${shareMode ? headingDir : isRTL ? "rtl" : "ltr"}`}
        dir={shareMode ? headingDir : isRTL ? "rtl" : "ltr"}
        lang={shareMode ? headingLng : undefined}
      >
        {recipe.description}
      </p>

      {localImgSrc ? (
        <img className="RecipeImage" src={localImgSrc} onError={() => setLocalImgSrc("")} />
      ) : loadImage ? (
        isImageLoading ? (
          <>
            <IconButton className="RoundedBtn large-loading" edge="end" disabled>
              <Box>
                <CircularProgress />
              </Box>
            </IconButton>
            <div className="HasImage">
              <span className="HasImage__title">{t("generate.loadingWithImage")}</span>
              <span className="HasImage__sub">{t("generate.loadingWithImageLowerMessage")}</span>
            </div>
          </>
        ) : (
          !shareMode && (
            <Button className="LoadImageBtn" variant="contained" onClick={handleLoadImage}>
              <ImageSearchIcon />
              {t("recipeUi.loadImage")}
            </Button>
          )
        )
      ) : null}

      <FilterBadges filters={filters} isRTL={isRTL} />

      <div className="PrintExtraDataBlock">
        <div className="RecipeExtraDataContainer">
          <div className="CaloryParent">
            <p>{t("recipeUi.calories")}</p>
            <div className="CaloriesDiv">
              <img className="CaloriesIcon" src="/calories.png" />
              <div className="CaloriesInnerDiv">
                <p>{recipe.calories}</p>
                <p>{t("recipeUi.kcal")}</p>
              </div>
            </div>
          </div>

          <div className="SugarParent">
            <p>{t("recipeUi.sugar")}</p>
            <div className="SugarAmountDiv">
              <img className="SugarIcon" src="/sugar.png" />
              <div className="SugarAmountInnerDiv">
                {Number(recipe.totalSugar) === 0 ? (
                  <p>None</p>
                ) : isRTL ? (
                  <div className="StatValueRowRtl">
                    <span>{t("units.gramShort")}</span>
                    <bdi dir="ltr">100</bdi>
                    <span>|</span>
                    <span>{t("units.tbspShort")}</span>
                    <bdi dir="ltr">{recipe.totalSugar}</bdi>
                  </div>
                ) : (
                  <div className="StatValueRowLtr">
                    <bdi dir="ltr">{recipe.totalSugar}</bdi>
                    <span>{t("units.tbspShort")}</span>
                    <span>|</span>
                    <bdi dir="ltr">100</bdi>
                    <span>{t("units.gramShort")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ProteinParent">
            <p>{t("recipeUi.protein")}</p>
            <div className="ProteinAmountDiv">
              <img className="ProteinIcon" src="/protein.png" />
              <div className="ProteinInnerDiv">
                {isRTL ? (
                  <div className="StatValueRowRtl">
                    <span>{t("units.gramShort")}</span>
                    <bdi dir="ltr">100</bdi>
                    <span>|</span>
                    <span>{t("units.gramShort")}</span>
                    <bdi dir="ltr">{recipe.totalProtein}</bdi>
                  </div>
                ) : (
                  <div className="StatValueRowLtr">
                    <bdi dir="ltr">{recipe.totalProtein}</bdi>
                    <span>{t("units.gramShort")}</span>
                    <span>|</span>
                    <bdi dir="ltr">100</bdi>
                    <span>{t("units.gramShort")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="HealthParent">
            <p>{t("recipeUi.health")}</p>
            <div className="HealthLevelDiv">
              <img className="HealthIcon" src="/health.png" />
            </div>
            <p className="BidiLtr">{recipe.healthLevel} / 10</p>
          </div>
        </div>

        <div className="RecipeBottomExtraDataContainer">
          <div className="AmountParent">
            <RestaurantIcon fontSize="small" />
            <p>x {recipe.amountOfServings}</p>
          </div>

          <div className="PrepTimeParent">
            <img className="ExtraDataImg" src={"/clock.png"} />
            <p>
              {recipe.prepTime} {t("units.minuteShort")}{" "}
            </p>
          </div>

          <div className="CountryNameParent">
            {shareMode && flag ? (
              <img className="ExtraDataFlagImg" src={flagEmojiToTwemojiUrl(flag)} alt="" />
            ) : (
              <span className="ExtraDataFlag">{flag}</span>
            )}
            <p>{recipe.countryOfOrigin}</p>
          </div>

          <div className="DifficultyParent">
            <img className="ExtraDataImg" src={difficulty.icon} />
            <p>{t(difficulty.labelKey)}</p>
          </div>
        </div>
      </div>

      <div className="RecipeStepsWide">
        <div className={`RecipeStepsGrid ${isRTL ? "rtl" : "ltr"}`}>
          <div className={`IngredientsList ${headingDir}`} dir={headingDir}>
            <h2 className={`IngredientsTitle ${headingDir}`} dir={headingDir}>
              {t("recipeUi.ingredients", { lng: headingLng })}
            </h2>

            {normalizedIngredients.map((line, index) => {
              const { ingredient, amount } = normalizeIngredientRow(line);
              return (
                <div key={index} className="IngredientRow">
                  <span className="IngredientName">{ingredient}</span>
                  <span className="IngredientAmount">{formatAmount(amount) ?? ""}</span>
                </div>
              );
            })}
          </div>

          <div className={`InstructionsList ${headingDir}`} dir={headingDir}>
            <h2 className={`InstructionsTitle ${headingDir}`} dir={headingDir}>
              {t("recipeUi.instructions", { lng: headingLng })}
            </h2>

            <ol className={`instructions-list ${headingDir}`} dir={headingDir}>
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
