import { useEffect, useState } from "react";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, RecipeModel, SugarRestriction } from "../../Models/RecipeModel";

import { useDispatch } from "react-redux";
import { resetGenerated } from "../../Redux/RecipeSlice";
import { RecipeData } from "../RecipeData/RecipeData";
import "./RecipeCard.css";

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

  const [imgSrc, setImgSrc] = useState<string>("");
  const dispatch = useDispatch();
  useEffect(() => {
    const url = (recipe.imageUrl ?? "").trim();
    setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [recipe.imageUrl]
  )

  return (
    <div className="RecipeCard">
      <div className="ClearFormDiv"
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
