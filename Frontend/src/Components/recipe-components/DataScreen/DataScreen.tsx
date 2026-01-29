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
import { Box, Button, CircularProgress, Dialog, IconButton, InputAdornment, TextField } from "@mui/material";
import { notify } from "../../../Utils/Notify";
import IosShareIcon from "@mui/icons-material/IosShare";
import { shareRecipeAsPdfWithToasts } from "../../../Services/ShareRecipeService";
import { useForm } from "react-hook-form";
import SendIcon from '@mui/icons-material/Send';

type QuestionProp = {
  query: string;
  recipe: RecipeModel;
};

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
  const instructions = recipe.data?.instructions ?? [];
  const recipeIsHebrew = hasHebrew(recipe.title) || hasHebrew(recipe.description) || ingredients.some((x: any) => hasHebrew(x?.ingredient ?? x)) || instructions.some((x: any) => hasHebrew(x));
  const headingLng: "he" | "en" = recipeIsHebrew ? "he" : "en";
  const headingDir: "rtl" | "ltr" = recipeIsHebrew ? "rtl" : "ltr";
  const layoutDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";
  const flag = getCountryFlag(recipe.countryOfOrigin);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<QuestionProp>({
  defaultValues: { query: "" }
});
  const handleClickOpen = () => setOpen(true);
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
      await shareRecipeAsPdfWithToasts({ ...recipe, imageUrl: (localImgSrc ?? "").trim() || (recipe as any)?.imageUrl || "" });
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
      const amountText = rawAmount === null || rawAmount === undefined ? "" : String(rawAmount).trim();
      if (!ingredientText) continue;
      if (!amountText && isModifierLine(ingredientText)) {
        appendToPrev(ingredientText);
        continue;
      }
      out.push(line);
    }
    return out;
  })();

  async function send(question: QuestionProp) {
    
      console.log(`${question.query}`)
   reset({ query: "" }); 
    setOpen(false);

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
      ) : null}
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
              <p>{recipe.calories} {t("recipeUi.kcal")}</p>
            </div>
          )}
        </div>
        <div className="Sugar">
          <p className="Title">{t("recipeUi.sugar")}</p>
          {Number(recipe.totalSugar) === 0 ? (
            <p>0</p>
          ) : isRTL ? (
            <div>
              <p>  כפיות ל100 גרם  </p> <p>  {recipe.totalSugar}</p>

            </div>) : (
            <div>
              <p>{recipe.totalSugar} table spoons (per 100 grams)</p>
            </div>
          )}
        </div>
        <div className="Protein">
          <p className="Title">{t("recipeUi.protein")}</p>
          {isRTL ? (
            <div className="ProteinInnerText">
              <p>  גרם ל100 גרם מאכל </p> <p>  {recipe.totalProtein}</p>
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

      <div className={`AskModelDiv ${isRTL ? "rtl" : "ltr"}`} onClick={handleClickOpen}>
        <img className="ChefImage" src={chef} />
        <h4>{t("recipeUi.ask")}</h4>
      </div>

<Dialog
  open={open}
  onClose={handleClose}
  fullScreen={false}
  maxWidth="sm"
  fullWidth
  className="AskDialog"
>
  <form className={`AskForm ${isRTL ? "rtl" : "ltr"}`} onSubmit={handleSubmit(send)}>
<TextField
  className="AskTextField"
  fullWidth
  multiline
  minRows={10}
  placeholder={t("recipeUi.ask")}
  {...register("query", { required: true, minLength: 2, maxLength: 300 })}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end" className="AskAdornment">
        <IconButton type="submit" className="AskSendBtn">
          <SendIcon className={`AskSendIcon ${isRTL ? "rtl" : "ltr"}`} />
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
  </form>
</Dialog>



      <div className="RecipePreparationWideView">
        <div className={`RecipeStepsGrid ${isRTL ? "rtl" : "ltr"}`}>
          <div className={`IngredientsList ${layoutDir}`} dir={layoutDir}>
            <h2 className={`IngredientsTitle ${layoutDir}`} dir={layoutDir}>
              {t("recipeUi.ingredients")}
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