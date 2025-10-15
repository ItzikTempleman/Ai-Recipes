import { IconButton, TextField, CircularProgress, InputAdornment, Box } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from "react-hook-form";
import "./RecipeScreen.css";
import { useTitle } from "../../../Utils/UseTitle";
import { RecipeState, RecipeTitleModel } from "../../../Models/RecipeModel";
import { notify } from "../../../Utils/Notify";
import { recipeService } from "../../../Services/RecipeService";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from '@mui/icons-material/Close';
import { resetGenerated } from "../../../Redux/RecipeSlice";
import { ImageSwitch } from "../../SectionsArea/ImageSwitch/ImageSwitch";
import { RecipeCard } from "../../CardsArea/RecipeCard/RecipeCard";


type RecipeStateType = {
  recipes: RecipeState
};

export function RecipeScreen() {
  useTitle("Recipe Screen");

  const dispatch = useDispatch();

  const { register, handleSubmit, reset } = useForm<RecipeTitleModel>();
  const [hasImage, setHasImage] = useState(false);

  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;

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
    <div className="RecipeScreen">
      <div className="SearchContainer">
        <ImageSwitch onChange={setHasImage} />
        <form onSubmit={handleSubmit(send)}>
          <TextField
            className="SearchTF"
            variant="outlined"
            size="small"
            fullWidth
            label="Generate recipe"
            placeholder="Generate recipe"
            {...register("title",
              {
                required:
                  "title is required"
              })}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <IconButton className="RoundedBtn" edge="end" disabled>
                      <Box><CircularProgress/></Box>
                    </IconButton>
                  ) : recipe ? (
                    <IconButton
                      className="RoundedBtn"
                      type="button"
                      edge="end"
                      aria-label="clear"
                      onClick={() => {
                        reset();
                        dispatch(resetGenerated());
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      className="RoundedBtn"
                      type="submit"
                      edge="end"
                      aria-label="search"
                      disabled={loading}
                    >
                      <SearchIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }} />
        </form>
        {
          error && <div className="ErrorText">{error}</div>
        }
        {
          loading && (
            hasImage ?
              <h3 className="LoadingWithImage">Generating image, this will take a minute or two...</h3> :
              <h3 className="LoadingWithoutImage">Generating recipe without an image, this will take a few seconds...</h3>
          )
        }
      </div>
      {
        recipe && (
          <div>
            <RecipeCard recipe={recipe} />
          </div>
        )
      }
    </div>
  );
}

