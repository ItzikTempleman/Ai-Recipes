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
          onClick={()=>{
              dispatch(resetGenerated());
          }}
          >Clear</Button></div>
      <h2>{recipe.title}</h2>
      <div className="Servings:">
        <p>Servings: {recipe.amountOfServings}</p>
      </div>
      <div className="Description">
        <p>{recipe.description}</p>
      </div>

      {imgSrc && (
        <img className="RecipeImage"
          src={imgSrc}
          onError={() => setImgSrc("")}
        />
      )}
      <div className="CalorieCount">
        <h4> Estimated calories: {recipe.calories}</h4>
      </div>

      <div className="Popularity">
        <p>World popularity level {recipe.popularity}/10</p>
      </div>

      <div className="Sugar">
        <p> total {recipe.totalSugar}g sugar,<br />{recipe.totalProtein}g protein (per 100 grams) </p>
      </div>
      <h3>Health level: {recipe.healthLevel}/10</h3>
      <div className="IngredientsList">
        {ingredients.map((line, index) => (
          <div key={index} className="IngredientRow">
            <span className="IngredientName">{line.ingredient}</span>
            <span className="IngredientAmount">{line.amount ?? ""}</span>
          </div>
        ))}
      </div>

      <div className="InstructionsList">
        <h2>Instructions</h2>
        <ol
          className={`instructions-list ${isRTL ? "rtl" : "ltr"}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}