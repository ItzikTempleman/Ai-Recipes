import {
  DietaryRestrictions,
  GlutenRestrictions,
  LactoseRestrictions,
  RecipeModel,
  SugarRestriction
} from "../../../Models/RecipeModel";
import { Filters } from "../RecipeDataContainer/RecipeDataContainer";
import { DataScreen } from "../DataScreen/DataScreen";
import { notify } from "../../../Utils/Notify";
import { recipeService } from "../../../Services/RecipeService";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../../../Utils/Utils";
import "./RecipeInfoScreen.css";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";

type Props = {
  filters?: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
};

export function RecipeInfoScreen({ filters, loadImage }: Props) {
  useTitle("Info");
  const { id } = useParams();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeModel>();

  const reduxRecipe = useSelector((state: AppState) => {
    if (!recipeId) return undefined;
    if (state.recipes.current?.id === recipeId) return state.recipes.current;
    return state.recipes.items.find((r) => r.id === recipeId);
  });

  useEffect(() => {
    if (!recipeId) {
      navigate("/home");
      return;
    }

    recipeService
      .getSingleRecipe(recipeId)
      .then(setRecipe)
      .catch((err) => notify.error(err));
  }, [recipeId, navigate]);

  useEffect(() => {
    if (reduxRecipe) {
      setRecipe(reduxRecipe);
    }
  }, [reduxRecipe]);

  if (!recipe) return null;

  async function loadImageHelper(recipe: RecipeModel) {
    if (loadImage) return loadImage(recipe);

    const updated = await recipeService.generateImageForSavedRecipe(recipe.id);
    setRecipe(updated);
    return updated;
  }

  const imgSrc = (() => {
    const url = (recipe.imageUrl ?? "").trim();
    return url && url !== "null" && url !== "undefined" ? url : "";
  })();

  const filtersFromRecipe: Filters = {
    sugarLevel: recipe.sugarRestriction ?? SugarRestriction.DEFAULT,
    hasLactose: recipe.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
    hasGluten: recipe.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
    dietType: recipe.dietaryRestrictions ?? DietaryRestrictions.DEFAULT,
  };

  return (
    <div className="RecipeInfoScreen">
      <div className="InfoScreenContainer">
        <DataScreen
          loadImage={loadImageHelper}
          recipe={recipe}
          imageSrc={imgSrc}
          filters={filters ?? filtersFromRecipe}
        />
      </div>
    </div>
  );
}