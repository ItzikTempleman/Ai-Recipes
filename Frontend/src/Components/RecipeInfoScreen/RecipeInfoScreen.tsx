import { useNavigate, useParams } from "react-router-dom";
import "./RecipeInfoScreen.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Filters } from "../RecipeCard/RecipeCard";
import { useTitle } from "../../Utils/Utils";
import { RecipeModel } from "../../Models/RecipeModel";
import { recipeService } from "../../Services/RecipeService";
import { notify } from "../../Utils/Notify";
import { RecipeData } from "../RecipeData/RecipeData";
import { ArrowBackIosNew } from "@mui/icons-material";

type Props = { filters?: Filters };
export function RecipeInfoScreen({ filters }: Props) {
const { t, i18n } = useTranslation();
 const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
 const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

  useEffect(() => {
   const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);

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
<div
  className={`BackBtnContainer ${isRTL ? "rtl" : "ltr"}`}
  onClick={returnToList}
>
  <ArrowBackIosNew />
  {t("recipeUi.back")}
</div>
      <div className="InfoScreenContainer">
        <RecipeData recipe={recipe} imageSrc={(recipe.imageUrl ?? "").trim()} filters={filters} />
      </div>
    </div>
  );
}

