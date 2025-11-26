
import { useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../../../Utils/Utils";
import "./InfoScreen.css";
import { useEffect, useState } from "react";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { RecipeModel } from "../../../Models/RecipeModel";
import { Button } from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';


export function InfoScreen() {
    useTitle("Info");
    const params = useParams();
    const recipeId = Number(params.id);
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<RecipeModel>();

    useEffect(
        () => {
            if (!recipeId) {
                navigate("/all-recipes-screen");
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
        navigate("/recipes-screen");
    }

    if (!recipe) return null;
    const ingredients = recipe.data?.ingredients ?? [];
    const instructions = recipe.data?.instructions ?? [];

    return (
        <div>
            <div className="TopSection">
                <Button className="BackBtn" variant="contained" onClick={returnToList}>
                    <ArrowBackIosIcon />
                    Back
                </Button>
            </div>

            <div className="InfoScreenContainer">

                {recipe.imageUrl && (
                    <img className="RecipeInImage" src={recipe.imageUrl} />
                )}
                <h2>{recipe.title}</h2>
      <div className="Servings:">
        <p>Servings: {recipe.amountOfServings}</p>
      </div>
      <div className="Description">
        <p>{recipe.description}</p>
      </div>
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
                    <ol>
                        {instructions.map((step, index) => (
                            <li key={index}>{step}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </div >
    );
}

