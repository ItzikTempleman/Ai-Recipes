import {  useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../../../Utils/Utils";
import "./RecipeInfoScreen.css";
import { useEffect, useState } from "react";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { RecipeModel } from "../../../Models/RecipeModel";
import { Button } from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { RecipeData } from "../../RecipeData/RecipeData";
import { Filters } from "../../RecipeCard/RecipeCard";


type Props = { filters?: Filters };
export function RecipeInfoScreen({ filters }: Props) {

  useTitle("Info");
  const params = useParams();
  const recipeId = Number(params.id);
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeModel>();
  
  useEffect(
    () => {
      if (!recipeId) {
        navigate("/home-screen");
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
    navigate("/home-screen");
  }

  if (!recipe) return null;

  return (
    <div className="RecipeInfoScreen">

      <div className="BackBtnContainer">
        <Button className="BackBtn" variant="contained" onClick={returnToList}>
          <ArrowBackIosIcon />
          Back
        </Button>
      </div>

      <div className="InfoScreenContainer">
       
<RecipeData recipe={recipe} imageSrc={(recipe.imageUrl ?? "").trim()} filters={filters} />
</div>
  
    </div >
  );
}

