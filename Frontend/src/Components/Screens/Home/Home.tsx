import { IconButton, TextField, CircularProgress, LinearProgress } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from "react-hook-form";
import "./Home.css";
import { useTitle } from "../../../Utils/UseTitle";
import { RecipeSwitch } from "../../Helpers/RecipeSwitch";
import { RecipeTitleModel } from "../../../Models/RecipeModel";
import { notify } from "../../../Utils/Notify";
import { recipeService } from "../../../Services/RecipeService";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RecipeCard } from "../../Cards/RecipeCard";
import { RecipeState } from "../../../Redux/RecipeSlice";

type RecipeStateType = { recipes: RecipeState };

export function Home() {
  useTitle("Home");
  const { register, handleSubmit, reset } = useForm<RecipeTitleModel>();
  const [hasImage, setHasImage] = useState(false);

  const { loading, items, error } = useSelector((state: RecipeStateType) => state.recipes);
  const latestRecipe = items[0]; 

  async function send(recipeTitle: RecipeTitleModel) {
    try {
      if (loading) return;
      await recipeService.generateRecipe(recipeTitle, hasImage);
      reset();
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="Home">
   
      <div className="MainContainer">
        <RecipeSwitch onChange={setHasImage} />

        <form onSubmit={handleSubmit(send)}>
          <TextField
            className="SearchTF"
            label="Generate recipe"
            placeholder="Generate recipe"
            {...register("title", { required: "title is required" })}
            disabled={loading}
          />
          <IconButton className="RoundedBtn" type="submit" disabled={loading}>
            {loading ? <CircularProgress  /> : <SearchIcon />}
          </IconButton>
        </form>
        {error && <div className="ErrorText">{error}</div>}
      </div>

   
   
      {latestRecipe && (
        <div>
          <RecipeCard recipe={latestRecipe} />
        
        </div>
      )}
    </div>
  );
}

