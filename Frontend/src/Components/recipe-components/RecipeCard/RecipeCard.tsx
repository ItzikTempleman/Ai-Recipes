import { useEffect, useState } from "react";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, RecipeModel, SugarRestriction } from "../../../Models/RecipeModel";
import { useDispatch } from "react-redux";
import { resetGenerated } from "../../../Redux/RecipeSlice";
import { DataScreen } from "../DataScreen/DataScreen";
import "./RecipeCard.css";
import { useTranslation } from "react-i18next";

export type Filters = {
  sugarLevel: SugarRestriction;
  hasLactose: LactoseRestrictions;
  hasGluten: GlutenRestrictions;
  dietType: DietaryRestrictions;
  
}

type RecipeProps = {
  recipe: RecipeModel;
  filters: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
};

export function RecipeCard({ recipe, filters ,loadImage}: RecipeProps) {
const {i18n } = useTranslation();
 const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
 const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

  useEffect(() => {
   const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);


  const [imgSrc, setImgSrc] = useState<string>("");
  const dispatch = useDispatch();
  useEffect(() => {
    const url = (recipe.imageUrl ?? "").trim();
    setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [recipe.imageUrl]
  )

  return (
<div className="RecipeCard">
  <div
    className={`ClearFormDiv ${isRTL ? "rtl" : "ltr"}`}
    onClick={() => dispatch(resetGenerated())}
  >
    ❌
  </div>

  <DataScreen filters={filters} recipe={recipe} imageSrc={imgSrc} loadImage={loadImage} />
</div>
  );
}
