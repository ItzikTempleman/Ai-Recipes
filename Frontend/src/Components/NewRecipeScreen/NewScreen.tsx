import { IconButton, TextField, CircularProgress, InputAdornment, Box } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from "react-hook-form";
import "./NewScreen.css";
import { useTitle } from "../../Utils/UseTitle";
import { RecipeState, InputModel } from "../../Models/RecipeModel";
import { notify } from "../../Utils/Notify";
import { recipeService } from "../../Services/RecipeService";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from '@mui/icons-material/Close';
import { resetGenerated } from "../../Redux/RecipeSlice";
import { ImageSwitch } from "../ImageSwitch/ImageSwitch";
import { RecipeCard } from "../RecipeCard/RecipeCard";



type RecipeStateType = {
  recipes: RecipeState
};

export function NewScreen() {
  useTitle("Generate Recipe");

  const dispatch = useDispatch();

  const { register, handleSubmit, reset } = useForm<InputModel>();
  const [hasImage, setHasImage] = useState(false);

  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;
      await recipeService.generateRecipe(recipeTitle, hasImage, 4);
      reset();
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="NewScreen">
      <p className="NewScreenTitle">Create new recipe</p>
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
            {...register("query",
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
          <div className="CenterRow">
            <RecipeCard recipe={recipe} />
          </div>
        )
      }
    </div>
  );
}

