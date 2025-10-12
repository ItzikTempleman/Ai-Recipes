import { IconButton, TextField, CircularProgress, InputAdornment } from "@mui/material";
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
  const recipe = items[0];

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
            variant="outlined"
            size="small"
            fullWidth
            label="Generate recipe"
            placeholder="Generate recipe"
            {...register("title", { required: "title is required" })}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    className="RoundedBtn"
                    type="submit"
                    edge="end"
                    disabled={loading}
                    aria-label="search"
                  >
                    {loading ? <CircularProgress/> : <SearchIcon/>}
                  </IconButton>
                </InputAdornment>
              )
            }
            }
          />
        </form>
        {
          error && <div className="ErrorText">{error}</div>
        }
        {
          loading && (
            hasImage ? <h3 className="LoadingWithImage">Generating image... this will take a minute or two...</h3> : <h3 className="LoadingWithoutImage">Generating recipe without an image... this will take a few seconds</h3>
          )
        }
      </div>
      {
        recipe && (
          <div>
            <RecipeCard recipe={recipe}/>
          </div>
        )
      }
    </div>
  );
}

