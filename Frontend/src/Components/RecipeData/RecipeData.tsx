import "./RecipeData.css";
import { formatAmount, getDifficultyLevel } from "../../Utils/Utils";
import { getCountryFlag } from "../../Utils/CountryFlag";
import { Filters } from "../RecipeCard/RecipeCard";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { FilterBadges } from "../Filters/FilterBadges";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { RecipeModel } from "../../Models/RecipeModel";
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import { Button } from "@mui/material";

type RecipeProps = {
  recipe: RecipeModel;
  imageSrc: string;
  filters?: Filters;
  loadImage: (recipe: RecipeModel) => Promise<RecipeModel>; 
};

export function RecipeData({ recipe, imageSrc, filters , loadImage}: RecipeProps) {
  const { t, i18n } = useTranslation();

  const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
  const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));
 const [localImgSrc, setLocalImgSrc] = useState(imageSrc);

 useEffect(() => {
    setLocalImgSrc(imageSrc);
  }, [imageSrc]);

    const handleLoadImage = async () => {
    try {
      const updated = await loadImage(recipe);
      const url = (updated.imageUrl ?? "").trim();
      setLocalImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, [i18n]);

  const difficulty = getDifficultyLevel(recipe.difficultyLevel);
  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];

  const normalizedIngredients = (() => {
    const out: typeof ingredients = [];

    for (const line of ingredients) {
      const ingredientText = String((line as any)?.ingredient ?? "").trim();
      const rawAmount = (line as any)?.amount;
      const amountText =
        rawAmount === null || rawAmount === undefined ? "" : String(rawAmount).trim();

      if (!ingredientText) continue;
      if (!amountText && out.length > 0) {
        (out[out.length - 1] as any).ingredient = `${String(
          (out[out.length - 1] as any).ingredient
        ).trim()}, ${ingredientText}`;
        continue;
      }

      out.push(line);
    }

    return out;
  })();


  return (
    <div className="RecipeData">
      <h2 className={`RecipeTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {recipe.title}
      </h2>

      <p className={`Description ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {recipe.description}
      </p>

<>
      {localImgSrc ? (
        <img
          className="RecipeImage"
          src={localImgSrc}
          alt={recipe.title}
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "")}
        />
      ) : (
        <Button className="LoadImageBtn" variant="contained" onClick={handleLoadImage}>
          <ImageSearchIcon />
          {t("recipeUi.loadImage")}
        </Button>
      )}
    </>

      <FilterBadges filters={filters} isRTL={isRTL} />

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
              <p>{Number(recipe.totalSugar) === 0 ? "None" : `${recipe.totalSugar}`}</p>
              <p>{Number(recipe.totalSugar) === 0 ? " " : `${t("units.tbspShort")} ${t("units.per100g")}`}</p>
            </div>
          </div>
        </div>

        <div className="ProteinParent">
          <p>{t("recipeUi.protein")}</p>
          <div className="ProteinAmountDiv">
            <img className="ProteinIcon" src="/protein.png" />
            <div className="ProteinInnerDiv">
              <p>{recipe.totalProtein} {t("units.per100g")} </p>

            </div>
          </div>
        </div>

        <div className="HealthParent">
          <p>{t("recipeUi.health")}</p>
          <div className="HealthLevelDiv">
            <img className="HealthIcon" src="/health.png" />
            <div className="HealthLevelInnerDiv">
              <p>{recipe.healthLevel}</p>
              <p> / 10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="RecipeBottomExtraDataContainer">
        <div className="AmountParent">
          <RestaurantIcon fontSize="small" />
          <p>x {recipe.amountOfServings}</p>
        </div>

        <div className="PrepTimeParent">
          <img className="ExtraDataImg" src={"/clock.png"} />
          <p>{recipe.prepTime} {t("units.minuteShort")} </p>
        </div>

        <div className="CountryNameParent">
          <span className="ExtraDataFlag">{getCountryFlag(recipe.countryOfOrigin)}</span>
          <p>{recipe.countryOfOrigin}</p>
        </div>

        <div className="DifficultyParent">
          <img className="ExtraDataImg" src={difficulty.icon} />
          <p>{t(difficulty.labelKey)}</p>
        </div>
      </div>


      <div className="RecipeStepsWide">
        <div className={`RecipeStepsGrid ${isRTL ? "rtl" : "ltr"}`}>
          <div className={`IngredientsList ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
            <h2 className={`IngredientsTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
              {isRTL ? "מצרכים" : "Ingredients"}
            </h2>

            {normalizedIngredients.map((line, index) => (
              <div key={index} className="IngredientRow">
                <span className="IngredientName">{(line as any).ingredient}</span>
                <span className="IngredientAmount">{formatAmount((line as any).amount) ?? ""}</span>
              </div>
            ))}
          </div>

          <div className="InstructionsList">
            <h2 className={`InstructionsTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
              {isRTL ? "הוראות הכנה" : "Instructions"}
            </h2>

            <ol className={`instructions-list ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
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
