import { useEffect, useState } from "react";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, RecipeModel, SugarRestriction } from "../../../Models/RecipeModel";
import { useDispatch } from "react-redux";
import { resetGenerated } from "../../../Redux/RecipeSlice";
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
  const dispatch = useDispatch();
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
        onClear={() => dispatch(resetGenerated())}
      />
    </div>
  );
}
