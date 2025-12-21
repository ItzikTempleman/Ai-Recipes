import { ArrowBackIosNew } from "@mui/icons-material";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, RecipeModel, SugarRestriction } from "../../Models/RecipeModel";
import { Filters } from "../RecipeCard/RecipeCard";
import { RecipeData } from "../RecipeData/RecipeData";
import { notify } from "../../Utils/Notify";
import { recipeService } from "../../Services/RecipeService";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../../Utils/Utils";
import { useTranslation } from "react-i18next";
import "./RecipeInfoScreen.css";

type Props = { 
   filters?: Filters;
  loadImage?: (recipe: RecipeModel) => Promise<RecipeModel>;
 };

export function RecipeInfoScreen({ filters, loadImage}: Props) {
  const { t, i18n } = useTranslation();
  const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
  const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, [i18n]);

  useTitle("Info");
  const { id } = useParams();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeModel>();

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

  function returnToList() {
    navigate("/home");
  }

  if (!recipe) return null;

  const filtersFromRecipe: Filters = {
    sugarLevel: recipe.sugarRestriction ?? SugarRestriction.DEFAULT,
    hasLactose: recipe.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
    hasGluten: recipe.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
    dietType: recipe.dietaryRestrictions ?? DietaryRestrictions.DEFAULT,
  };

  return (
    <div className="RecipeInfoScreen">
      <div className={`BackBtnContainer ${isRTL ? "rtl" : "ltr"}`} onClick={returnToList}>
        <ArrowBackIosNew />
        {t("recipeUi.back")}
      </div>

      <div className="InfoScreenContainer">
        <RecipeData
        loadImage={loadImage}
          recipe={recipe}
          imageSrc={(recipe.imageUrl ?? "").trim()}
          filters={filters ?? filtersFromRecipe}
        />
      </div>
    </div>
  );
}

