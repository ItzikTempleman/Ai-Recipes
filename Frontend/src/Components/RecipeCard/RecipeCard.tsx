import { useEffect, useState } from "react";
import "./RecipeCard.css";
import { RecipeModel } from "../../Models/RecipeModel";
import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { resetGenerated } from "../../Redux/RecipeSlice";
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
      <h2>{recipe.title}</h2>

      <div className="Description">
        <p>{recipe.description}</p>
      </div>

      {imgSrc && (
        <img className="RecipeImage"
          src={imgSrc}
          onError={() => setImgSrc("")}
        />
      )}
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
            <div className="SugarAmountInnerDiv"><p>{Number(recipe.totalSugar) === 0
              ? "0" : `${recipe.totalSugar}`} </p> <p>{Number(recipe.totalSugar) === 0 ? " " : "tbs | 100g"} </p></div>
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
        <h3>Ingredients</h3>
        {ingredients.map((line, index) => (
          <div key={index} className="IngredientRow">
            <span className="IngredientName">{line.ingredient}</span>
            <span className="IngredientAmount">{line.amount ?? ""}</span>
          </div>
        ))}
      </div>

      <div className="InstructionsList">
        <h3>Instructions</h3>
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