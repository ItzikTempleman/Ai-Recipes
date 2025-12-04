import { IconButton, TextField, CircularProgress, Box, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import "./GenerateScreen.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from '@mui/icons-material/Close';
import { InputModel, RecipeState, SugarRestriction } from "../../../Models/RecipeModel";
import { useTitle } from "../../../Utils/Utils";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { ImageSwitch } from "../../UtilComponents/ImageSwitch/ImageSwitch";
import { resetGenerated } from "../../../Redux/RecipeSlice";
import { RecipeCard } from "../../RecipeCard/RecipeCard";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import TuneIcon from '@mui/icons-material/Tune';

import { Filters } from "../../UtilComponents/Filters/Filters";

type RecipeStateType = {
  recipes: RecipeState
};

export function GenerateScreen() {
  useTitle("Generate");

  const dispatch = useDispatch();
const [sugarLevel, setSugarLevel] = useState<SugarRestriction>(SugarRestriction.DEFAULT);

  const { register, handleSubmit, reset } = useForm<InputModel>();
  const [initialQuantity, setQuantity] = useState(1);
  const [hasImage, setHasImage] = useState(false);

  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;
      await recipeService.generateRecipe(recipeTitle, hasImage, initialQuantity, sugarLevel);
      reset();
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="GenerateScreen">
      <div className="SearchContainer">

        <form onSubmit={handleSubmit(send)}>
          <div className="InputData">
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
            />
            {loading ? (
              <IconButton className="RoundedBtn" edge="end" disabled>
                <Box><CircularProgress /></Box>
              </IconButton>
            ) : recipe ? (
              <Button
                variant="contained"
                className="RectangularBtn"
                type="button"
                aria-label="clear"
                onClick={() => {
                  reset();
                  dispatch(resetGenerated());
                }}
              >
                <CloseIcon />
              </Button>
            ) : (
              <Button
                variant="contained"
                className="RectangularBtn"
                type="submit"
                aria-label="search"
                disabled={loading}
              >
                Go <AutoAwesome className="BtnIcon" />
              </Button>
            )}
          </div>

          <TuneIcon />
          <div className="FiltersColumn">

            <div className="Servings">
              <p>Servings</p>
              <select className="QuantitySelector" value={initialQuantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {
                  [...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))
                }
              </select>
            </div>
            <div className="ImageSwitchRow">
              <ImageSwitch onChange={setHasImage} />
            </div>
            <div>
              <Filters onSugarLevelSelect={(sl)=>{
                setSugarLevel(sl)
              }}/>
            </div>
          </div>
        </form>

        {
          error && <div className="ErrorText">{error}</div>
        }
        {
          loading && (
            hasImage ?
              <h3 className="LoadingWithImage">Preparing your recipe… Loading image…</h3> :
              <h3 className="LoadingWithoutImage">Preparing your recipe…</h3>
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

