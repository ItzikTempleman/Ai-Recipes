import { useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../../../Utils/Utils";
import "./RecipeInfoScreen.css";
import { useEffect, useState } from "react";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { RecipeModel } from "../../../Models/RecipeModel";

import { RecipeData } from "../../RecipeData/RecipeData";
import { Filters } from "../../RecipeCard/RecipeCard";
import { useTranslation } from "react-i18next";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";


type Props = { filters?: Filters };
export function RecipeInfoScreen({ filters }: Props) {

  const isRTL = document.documentElement.dir === "rtl";
  const ArrowIcon = isRTL ? ArrowForwardIosIcon : ArrowBackIosNewIcon;

    const { t } = useTranslation();
  useTitle("Info");
  const params = useParams();
  const recipeId = Number(params.id);
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeModel>();

  useEffect(
    () => {
      if (!recipeId) {
        navigate("/home");
        return;
      };
      recipeService.getSingleRecipe(recipeId)
        .then(dbRecipe => {
          setRecipe(dbRecipe);
        }
        ).catch(err =>
          notify.error(err)
        )
    }, [recipeId, navigate]
  )

  function returnToList() {
    navigate("/home");
  }

  if (!recipe) return null;

  return (
    <div className="RecipeInfoScreen">

      <div className="BackBtnContainer" onClick={returnToList}>
          <ArrowIcon />
          {t("recipeUi.back")}
      </div>

      <div className="InfoScreenContainer">
        <RecipeData recipe={recipe} imageSrc={(recipe.imageUrl ?? "").trim()} filters={filters} />
      </div>
    </div>
  );
}

