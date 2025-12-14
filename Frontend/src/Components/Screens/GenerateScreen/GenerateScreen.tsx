import { IconButton, TextField, CircularProgress, Box, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import "./GenerateScreen.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { DietaryRestrictions, GlutenRestrictions, InputModel, LactoseRestrictions, RecipeState, SugarRestriction } from "../../../Models/RecipeModel";
import { useTitle } from "../../../Utils/Utils";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { RecipeCard } from "../../RecipeCard/RecipeCard";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { ImageSwitch } from "../../Filters/ImageSwitch";
import { SugarFilter } from "../../Filters/SugarFilter";
import { LactoseFilter } from "../../Filters/LactoseFilter";
import { GlutenFilter } from "../../Filters/GlutenFilter";
import { DietaryFilter } from "../../Filters/DietaryFilter";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import RestaurantIcon from '@mui/icons-material/Restaurant';

type RecipeStateType = {
  recipes: RecipeState
};

export function GenerateScreen() {
  useTitle("Generate");
  const [sugarLevel, setSugarLevel] = useState<SugarRestriction>(SugarRestriction.DEFAULT);
  const [hasImage, setHasImage] = useState(true);
  const [hasLactose, setHasLactose] = useState(LactoseRestrictions.DEFAULT);
  const [hasGluten, setHasGluten] = useState(GlutenRestrictions.DEFAULT);
  const [dietType, setDietType] = useState(DietaryRestrictions.DEFAULT);
  const { register, handleSubmit, reset } = useForm<InputModel>(
    {
      defaultValues: {
        query: "",
        excludedIngredients: ["", "", ""]
      },
    }
  );
  const [initialQuantity, setQuantity] = useState(1);
  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;
  const [filtersResetKey, setFiltersResetKey] = useState(0);

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;
      await recipeService.generateRecipe(recipeTitle, hasImage, initialQuantity, sugarLevel, hasLactose, hasGluten, dietType, recipeTitle.excludedIngredients);
      reset({
        query: "",
        excludedIngredients: ["", "", ""],
      });
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="GenerateScreen">
      <div>
        <h2 className="GenerateTitle">
          <RestaurantMenuIcon className="TitleIcon" />
          <span>So, what are we eating today?</span>
        </h2>
      </div>

      <div className="GenerateContainer">
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
              disabled={loading} />
            {loading ? (
              <IconButton className="RoundedBtn small-loading" edge="end" disabled>
                <Box><CircularProgress /></Box>
              </IconButton>
            ) : recipe ? (
              <div className="ClearPromptIcon"
                onClick={() => {
                  reset({
                    query: "",
                    excludedIngredients: ["", "", ""]
                  });
                  setQuantity(1);
                  setHasImage(true);
                  setSugarLevel(SugarRestriction.DEFAULT);
                  setHasLactose(LactoseRestrictions.DEFAULT);
                  setHasGluten(GlutenRestrictions.DEFAULT);
                  setDietType(DietaryRestrictions.DEFAULT);
                  setFiltersResetKey(k => k + 1);
                }}>❌</div>
            ) : (
              <Button
                variant="contained"
                className="RectangularBtn"
                type="submit"
                aria-label="search"
                disabled={loading}>
                Go <AutoAwesome className="BtnIcon" />
              </Button>
            )}
          </div>
          <div className="FiltersColumn" key={filtersResetKey}>
            <div className="Servings">
                      <div className="GenerateAmountDiv">
        <RestaurantIcon fontSize="medium"/>
          <p>x</p>
        </div>
              <select
                className="QuantitySelector"
                value={initialQuantity}
                onChange={(e) => setQuantity(Number(e.target.value))}>
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
              <SugarFilter onSugarLevelSelect={(sl) => {
                setSugarLevel(sl)
              }} />
            </div>
            <div>
              <LactoseFilter onChange={setHasLactose} />
            </div>
            <div>
              <GlutenFilter onChange={setHasGluten} />
            </div>
            <div>
              <DietaryFilter onDietSelect={(d) => {
                setDietType(d)
              }} />
            </div>
            <div className="ExcludedSection">
              <div>
                <TextField className="ExcludeTF"
                  variant="outlined"
                  size="small"
                  placeholder="Exclude ingredient"
                  {...register("excludedIngredients.0")}
                />
              </div>

              <div >
                <TextField className="ExcludeTF"
                  variant="outlined"
                  size="small"
                  placeholder="Exclude ingredient"
                  {...register("excludedIngredients.1")}
                />
              </div>

              <div>
                <TextField className="ExcludeTF"
                  variant="outlined"
                  size="small"
                  placeholder="Exclude ingredient"
                  {...register("excludedIngredients.2")}
                />
              </div>
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
            <RecipeCard recipe={recipe} filters={{
              sugarLevel,hasLactose,hasGluten,dietType,
            }} />
          </div>
        )
      }
    </div>
  );
}

