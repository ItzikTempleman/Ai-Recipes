import { useEffect, useState } from "react";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, RecipeModel, SugarRestriction } from "../../../Models/RecipeModel";
import { DataScreen } from "../DataScreen/DataScreen";
import "./RecipeDataContainer.css";

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

export function RecipeDataContainer({ recipe, filters, loadImage }: RecipeProps) {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    const url = (recipe.imageUrl ?? "").trim();
    setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [recipe.imageUrl]
  )

  return (
    <div className="RecipeDataContainer">
      <DataScreen
        filters={filters}
        recipe={recipe}
        imageSrc={imgSrc}
        loadImage={loadImage}

      />
    </div>
  );
}
