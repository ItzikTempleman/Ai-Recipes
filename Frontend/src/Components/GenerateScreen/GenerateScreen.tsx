import { IconButton, TextField, CircularProgress, Box, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import "./GenerateScreen.css";
import { useState } from "react";
import { useSelector } from "react-redux";


import AutoAwesome from "@mui/icons-material/AutoAwesome";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { useTranslation } from "react-i18next";
import { useTitle } from "../../Utils/Utils";
import { recipeService } from "../../Services/RecipeService";
import { notify } from "../../Utils/Notify";
import { LactoseFilter } from "../Filters/LactoseFilter";
import { SugarFilter } from "../Filters/SugarFilter";
import { ImageSwitch } from "../Filters/ImageSwitch";
import { GlutenFilter } from "../Filters/GlutenFilter";
import { DietaryFilter } from "../Filters/DietaryFilter";
import { RecipeCard } from "../RecipeCard/RecipeCard";
import { DietaryRestrictions, GlutenRestrictions, InputModel, LactoseRestrictions, RecipeState, SugarRestriction } from "../../Models/RecipeModel";


type RecipeStateType = {
  recipes: RecipeState
};

export function GenerateScreen() {
const { t } = useTranslation();

  useTitle("Generate");
  const [filtersResetKey, setFiltersResetKey] = useState(0);
  const [sugarLevel, setSugarLevel] = useState<SugarRestriction>(SugarRestriction.DEFAULT);
  const [hasImage, setHasImage] = useState(true);
  const [hasLactose, setHasLactose] = useState(LactoseRestrictions.DEFAULT);
  const [hasGluten, setHasGluten] = useState(GlutenRestrictions.DEFAULT);
  const [dietType, setDietType] = useState(DietaryRestrictions.DEFAULT);
  const { register, handleSubmit, reset } = useForm<InputModel>(
    {
      defaultValues: {
        query: "",
        excludedIngredients: [""]
      },
    }
  );

  const [initialQuantity, setQuantity] = useState(1);
  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;

      const raw = recipeTitle.excludedIngredients?.[0] ?? "";
      const excludedList = raw
        .split(/[\n,]+/g)
        .map(s => s.trim())
        .filter(Boolean);


      await recipeService.generateRecipe(recipeTitle, hasImage, initialQuantity, sugarLevel, hasLactose, hasGluten, dietType, excludedList);
      setQuantity(1);
      setHasImage(true);
      setSugarLevel(SugarRestriction.DEFAULT);
      setHasLactose(LactoseRestrictions.DEFAULT);
      setHasGluten(GlutenRestrictions.DEFAULT);
      setDietType(DietaryRestrictions.DEFAULT);
      setFiltersResetKey(k => k + 1);
      reset({
        query: "",
        excludedIngredients: [""]
      });
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="GenerateScreen">


      <div className="GenerateContainer">
              <div>
        <h2 className="GenerateTitle">
          <RestaurantMenuIcon className="TitleIcon" />
          <span>{t("generate.title")}</span>
        </h2>
      </div>
        <form onSubmit={handleSubmit(send)}>
          <div className="InputData">
            <TextField
              className="SearchTF"
              size="small"
              label={t("generate.labelGenerate")}
              {...register("query",
                {
                  required:
                    `${t("generate.requiredTitle")}`
                })}
              disabled={loading} />
            {loading ? (
              <IconButton className="RoundedBtn small-loading" edge="end" disabled>
                <Box><CircularProgress /></Box>
              </IconButton>
            ) : (
              <Button
                variant="contained"
                className="RectangularBtn"
                type="submit"
                aria-label="search"
                disabled={loading}>
                {t("generate.go")} <AutoAwesome className="BtnIcon" />
              </Button>
            )}
          </div>
          {
            error && <div className="ErrorText">{error}</div>
          }
          {
            loading && (
             <h2 className="Loading">
  {hasImage ? t("generate.loadingWithImage") : t("generate.loadingNoImage")}
</h2>

            )
          }
          <div className="FiltersColumn">
            <div className="Servings">
              <p>{t("generate.quantitySelector")}</p>
              <select className="QuantitySelector"
                value={initialQuantity}
                onChange={(e) => setQuantity(Number(e.target.value))}>
                {
                  [...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))
                }
              </select>
            </div>
            <div className="ExcludedSection">
              <div>
                <TextField className="ExcludeTF"
                  label={t("generate.excludeIngredient")}
                  size="small"
                  {...register("excludedIngredients.0")}
                />
              </div>
            </div>
            <div className="ImageSwitchRow">
              <ImageSwitch onChange={setHasImage} />
            </div>
            <div>
              <SugarFilter
                key={`sugar-${filtersResetKey}`}
                onSugarLevelSelect={(sl) => {
                  setSugarLevel(sl)
                }} />
            </div>
            <div>
              <LactoseFilter
                key={`lac-${filtersResetKey}`}
                onChange={setHasLactose} />
            </div>
            <div>
              <GlutenFilter
                key={`glu-${filtersResetKey}`}
                onChange={setHasGluten} />
            </div>
            <div>
              <DietaryFilter
                key={`diet-${filtersResetKey}`}
                onDietSelect={(d) => {
                  setDietType(d)
                }} />
            </div>
          </div>
        </form>
      </div>
      {
        recipe && (
          <div className="CenterRow">
            <RecipeCard recipe={recipe} filters={{
              sugarLevel, hasLactose, hasGluten, dietType,
            }} />
          </div>
        )
      }
    </div>
  );
}

