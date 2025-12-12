import { useEffect, useState } from "react";
import "./RecipeCard.css";
import { RecipeModel } from "../../Models/RecipeModel";
import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { resetGenerated } from "../../Redux/RecipeSlice";
import { formatAmount, getDifficultyLevel } from "../../Utils/Utils";
import { getCountryFlag } from "../../Utils/CountryFlag";
type RecipeProps = {
  recipe: RecipeModel
};


export function RecipeCard({ recipe }: RecipeProps) {

  const [imgSrc, setImgSrc] = useState<string>("");


  const dispatch = useDispatch();
  useEffect(() => {
    const url = (recipe.imageUrl ?? "").trim();
    setImgSrc(url && url !== "null" && url !== "undefined" ? url : "");
  }, [recipe.imageUrl]
  )


const difficulty = getDifficultyLevel(recipe.difficultyLevel);
  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];
  const isRTL = /[\u0590-\u05FF]/.test(instructions.join(" "));
  return (
    <div className="RecipeCard">
      <div className="ClearFormDiv">
        <Button className="ClearFormBtn"
          variant="contained"
          onClick={() => {
            dispatch(resetGenerated());
          }}
        >Clear</Button></div>

      <h2 className={`RecipeTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>{recipe.title}</h2>
      <p className={`Description ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>{recipe.description}</p>

      {imgSrc && (
        <img className="RecipeImage"
          src={imgSrc}
          onError={() => setImgSrc("")}
        />
      )}

      
      <div className="ExtraDataContainer">
        <div className="PrepTimeDiv">
          <img className="ExtraDataImg" src={"/clock.png"} />
          <p>{recipe.prepTime} m </p>
        </div>

        <div className="CountryNameDiv">
       <span className="ExtraDataFlag">{getCountryFlag(recipe.countryOfOrigin)}</span>
          <p>{recipe.countryOfOrigin}</p>
        </div>

        <div className="DifficultyDiv">
          <img className="ExtraDataImg" src={difficulty.icon} />
          <p>{difficulty.label}</p>
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


      <div
        className={`IngredientsList ${isRTL ? "rtl" : "ltr"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >

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
            <li key={index}>{step}
              <hr className="divider" />
            </li>

          ))}
        </ol>
      </div>
    </div>
  );
}
