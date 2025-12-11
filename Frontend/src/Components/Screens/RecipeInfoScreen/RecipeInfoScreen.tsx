
import { useNavigate, useParams } from "react-router-dom";
import { formatAmount, useTitle } from "../../../Utils/Utils";
import "./RecipeInfoScreen.css";
import { useEffect, useState } from "react";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { RecipeModel } from "../../../Models/RecipeModel";
import { Button } from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';



export function RecipeInfoScreen() {
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
  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];
  const isRTL = /[\u0590-\u05FF]/.test(instructions.join(" "));
  return (
    <div className="RecipeInfoScreen">

      <div className="BackBtnContainer">
        <Button className="BackBtn" variant="contained" onClick={returnToList}>
          <ArrowBackIosIcon />
          Back
        </Button>
      </div>

      <div className="InfoScreenContainer">

        {recipe.imageUrl && (
          <img className="RecipeInImage" src={recipe.imageUrl} />
        )}


        <h2 className={`RecipeTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>{recipe.title} {!isRTL ? "for" : "עבור"} {recipe.amountOfServings}  {!isRTL ? "servings" : "מנות"}</h2>
        <p className={`Description ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>{recipe.description}</p>

        <div className="ExtraDataContainer">
          <div>
            <p>Total preparation time: ~ {recipe.prepTime} minutes </p>
          </div>
          <div>
            <p>Origin: {recipe.countryOfOrigin}</p>
          </div>
          <div>
            <p>Difficulty level: {recipe.difficultyLevel}</p>
          </div>
        </div>


        <div className="DataContainer">
          <div className="AmountParent">
            <p>Portions</p>
            <div className="AmountDiv">
              <img className="ServingsIcon" src="/servings.png" />
              <div className="AmountInnerDiv"><p>x</p><p> {recipe.amountOfServings}</p></div>
            </div>
          </div>

          <div className="CaloryParent">
            <p>Calories</p>
            <div className="CaloriesDiv">
              <img className="CaloriesIcon" src="/calories.png" />
              <div className="CaloriesInnerDiv"><p>{recipe.calories}</p><p>kcal</p></div>
            </div>
          </div>

          <div className="SugarParent">
            <p>Sugar</p>
            <div className="SugarAmountDiv">
              <img className="SugarIcon" src="/sugar.png" />
              <div className="SugarAmountInnerDiv"><p>{Number(recipe.totalSugar) === 0 ? "None" : `${recipe.totalSugar}`} </p> <p>{Number(recipe.totalSugar) === 0 ? " " : "tbs | 100g"} </p></div>
            </div>
          </div>

          <div className="ProteinParent">
            <p>Protein</p>
            <div className="ProteinAmountDiv">
              <img className="ProteinIcon" src="/protein.png" />
              <div className="ProteinInnerDiv"><p>{recipe.totalProtein}g </p><p> | 100g</p></div>
            </div>
          </div>

          <div className="HealthParent">
            <p>Health</p>
            <div className="HealthLevelDiv">
              <img className="HealthIcon" src="/health.png" />
              <div className="HealthLevelInnerDiv"><p>{recipe.healthLevel}</p><p> / 10</p></div>
            </div>
          </div>
        </div>


        <div className={`IngredientsList ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
          <h2 className={`IngredientsTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>{isRTL ? "מצרכים" : "Ingredients"}</h2>

          {ingredients.map((line, index) => (
            <div key={index} className="IngredientRow">
              <span className="IngredientName">{line.ingredient}</span>
              <span className="IngredientAmount">{formatAmount(line.amount) ?? ""}</span>
            </div>
          ))}
        </div>

        <div className="InstructionsList">
          <h2 className={`InstructionsTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>{isRTL ? "הוראות הכנה" : "Instructions"}</h2>
          <ol
            className={`instructions-list ${isRTL ? "rtl" : "ltr"}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {instructions.map((step, index) => (
              <><li key={index}>{step}</li><hr className="divider" /></>
            ))}
          </ol>
        </div>
      </div>
    </div >
  );
}

