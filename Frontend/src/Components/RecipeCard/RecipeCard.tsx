import { useEffect, useState } from "react";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, RecipeModel, SugarRestriction } from "../../Models/RecipeModel";

import { useDispatch } from "react-redux";
import { resetGenerated } from "../../Redux/RecipeSlice";
import { RecipeData } from "../RecipeData/RecipeData";
import "./RecipeCard.css";
import { useTranslation } from "react-i18next";

export type Filters = {
  sugarLevel: SugarRestriction;
  hasLactose: LactoseRestrictions,
  hasGluten: GlutenRestrictions,
  dietType: DietaryRestrictions
}

type RecipeProps = {
  recipe: RecipeModel,
  filters: Filters
};

export function RecipeCard({ recipe, filters }: RecipeProps) {
const { i18n } = useTranslation();
const isRTL = (i18n.resolvedLanguage ?? i18n.language ?? "").startsWith("he");
  const [imgSrc, setImgSrc] = useState<string>("");
  const dispatch = useDispatch();
  useEffect(() => {
    const url = (recipe.imageUrl ?? "").trim();
    setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [recipe.imageUrl]
  )

  return (
    <div className="RecipeCard">
      <div className={`<ClearFormDiv> ${isRTL ? "rtl" : ""}`}
          onClick={() => {
            dispatch(resetGenerated());
          }}>❌</div>

      <RecipeData
        filters={filters}
        recipe={recipe}
        imageSrc={imgSrc}
      />
    </div>
  );
}
