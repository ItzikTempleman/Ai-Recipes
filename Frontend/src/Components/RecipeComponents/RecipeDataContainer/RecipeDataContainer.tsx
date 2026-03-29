import { useEffect, useMemo, useState } from "react";
import {
  DietaryRestrictions,
  GlutenRestrictions,
  LactoseRestrictions,
  RecipeModel,
  SugarRestriction,
} from "../../../Models/RecipeModel";
import { DataScreen } from "../DataScreen/DataScreen";
import "./RecipeDataContainer.css";

export type Filters = {
  sugarLevel: SugarRestriction;
  hasLactose: LactoseRestrictions;
  hasGluten: GlutenRestrictions;
  dietType: DietaryRestrictions;
};

type RecipeProps = {
  recipe: RecipeModel;
  filters: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
  onExitRecipe?: () => void;
};

export function RecipeDataContainer({
  recipe,
  filters,
  loadImage,
  onExitRecipe,
}: RecipeProps) {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    const url = (recipe.imageUrl ?? "").trim();
    setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [recipe.imageUrl]);

  const filtersToDisplay = useMemo<Filters>(() => {
    return {
      sugarLevel:
        recipe.sugarRestriction ?? filters.sugarLevel ?? SugarRestriction.DEFAULT,
      hasLactose:
        recipe.lactoseRestrictions ?? filters.hasLactose ?? LactoseRestrictions.DEFAULT,
      hasGluten:
        recipe.glutenRestrictions ?? filters.hasGluten ?? GlutenRestrictions.DEFAULT,
      dietType:
        recipe.dietaryRestrictions ?? filters.dietType ?? DietaryRestrictions.DEFAULT,
    };
  }, [
    recipe.sugarRestriction,
    recipe.lactoseRestrictions,
    recipe.glutenRestrictions,
    recipe.dietaryRestrictions,
    filters,
  ]);

  return (
    <div className="RecipeDataContainer">
      <DataScreen
        filters={filtersToDisplay}
        recipe={recipe}
        imageSrc={imgSrc}
        loadImage={loadImage}
        onExitRecipe={onExitRecipe}
      />
    </div>
  );
}