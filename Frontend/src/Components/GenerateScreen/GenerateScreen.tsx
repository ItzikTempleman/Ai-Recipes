import { IconButton, TextField, CircularProgress, Box, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import "./GenerateScreen.css";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { useTranslation } from "react-i18next";
import { useTitle } from "../../Utils/Utils";
import { recipeService } from "../../Services/RecipeService";
import { notify } from "../../Utils/Notify";
import { LactoseFilter } from "../Filters/LactoseFilter";
import { SugarFilter } from "../Filters/SugarFilter";
import { GlutenFilter } from "../Filters/GlutenFilter";
import { DietaryFilter } from "../Filters/DietaryFilter";
import { RecipeCard } from "../RecipeCard/RecipeCard";
import { DietaryRestrictions, GlutenRestrictions, InputModel, LactoseRestrictions, RecipeModel, RecipeState, SugarRestriction } from "../../Models/RecipeModel";
import { resetGenerated } from "../../Redux/RecipeSlice";
import { AppState } from "../../Redux/Store";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HideImageOutlinedIcon from '@mui/icons-material/HideImageOutlined';
import ImageIcon from '@mui/icons-material/Image';

type RecipeStateType = {
  recipes: RecipeState
};

export function GenerateScreen() {
  useTitle("Generate");
  const [filtersResetKey, setFiltersResetKey] = useState(0);
  const [sugarLevel, setSugarLevel] = useState<SugarRestriction>(SugarRestriction.DEFAULT);
  const [hasImage, setHasImage] = useState(false);
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
  const [appliedFilters, setAppliedFilters] = useState({
    sugarLevel: SugarRestriction.DEFAULT,
    hasLactose: LactoseRestrictions.DEFAULT,
    hasGluten: GlutenRestrictions.DEFAULT,
    dietType: DietaryRestrictions.DEFAULT,
  });
  const { t, i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(() => i18n.language?.startsWith("he"));
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.user);
  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(lng?.startsWith("he"));
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, [i18n]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialQuantity, setQuantity] = useState(1);
  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;
  const recipeHasData = Boolean(recipe?.title);
  const didResetOnEnterRef = useRef(false);

  useEffect(() => {
    if (
      user &&
      !loading &&
      !didResetOnEnterRef.current
    ) {
      dispatch(resetGenerated());
      didResetOnEnterRef.current = true;
    }
  }, [dispatch, user, loading]);

  async function loadImage(recipe: RecipeModel): Promise<RecipeModel> {
    if (recipe.id) {
      const updated = await recipeService.generateImageForSavedRecipe(recipe.id);
      return updated;
    }
    const preview = await recipeService.generateImagePreview(recipe);

    return {
      ...recipe,
      imageUrl: preview.imageUrl,
      imageName: preview.imageName ?? recipe.imageName ?? null,
    };
  }

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;

      dispatch(resetGenerated())
      setFiltersOpen(false);
      const raw = recipeTitle.excludedIngredients?.[0] ?? "";
      const excludedList = raw.split(/[\n,]+/g).map(s => s.trim()).filter(Boolean);
      const used = { sugarLevel, hasLactose, hasGluten, dietType };
      setAppliedFilters(used);
      await recipeService.generateRecipe(recipeTitle, hasImage, initialQuantity, sugarLevel, hasLactose, hasGluten, dietType, excludedList);
      setQuantity(1);
      setHasImage(false);
      setSugarLevel(SugarRestriction.DEFAULT);
      setHasLactose(LactoseRestrictions.DEFAULT);
      setHasGluten(GlutenRestrictions.DEFAULT);
      setDietType(DietaryRestrictions.DEFAULT);
      setFiltersResetKey(k => k + 1);

      reset({ query: "", excludedIngredients: [""] });
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className={`GenerateScreen ${recipeHasData ? "GenerateScreen--hasData" : ""}`}>
      <div className="GenerateContainer">
        <div>
          <h2 className={`GenerateTitle ${isRTL ? "rtl" : "ltr"}`}>{t("generate.title")}</h2>
        </div>
        <form onSubmit={handleSubmit(send)}>
          <div className={`InputData ${isRTL ? "rtl" : ""}`}>
 <TextField
  dir={isRTL ? "rtl" : "ltr"}  
  className="SearchTF"
  size="small"
  label={t("generate.labelGenerate")}
  {...register("query", { required: `${t("generate.requiredTitle")}` })}
  disabled={loading}
  InputProps={{ dir: isRTL ? "rtl" : "ltr" }}
  inputProps={{ style: { textAlign: isRTL ? "right" : "left" } }}
  InputLabelProps={{ style: { direction: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" } }}
/>
            <IconButton
              className={`ImageToggleBtn ${hasImage ? "on" : "off"}`}
              onClick={() => setHasImage(image => !image)}
            >
              {hasImage ? <ImageIcon /> : <HideImageOutlinedIcon />}
            </IconButton>
            {loading ? (
              <IconButton className="RoundedBtn large-loading" edge="end" disabled>
                <Box><CircularProgress /></Box>
              </IconButton>
            ) : ( 
              <Button
                className="GenerateRecipeBtn"
                variant="contained"
                disableElevation
                type="submit"
                disabled={loading}>
                {t("generate.go")}<AutoAwesome className="BtnIcon" />
              </Button>
            )}
          </div>
          {
            error && <div className="ErrorText">{error}</div>
          }
          {
            loading && (
              <h2 className="Loading">
                {hasImage ? (
                  <div className="HasImage">
                    <span className="HasImage__title">{t("generate.loadingWithImage")}</span>
                    <span className="HasImage__sub">{t("generate.loadingWithImageLowerMessage")}</span>
                  </div>
                ) : (
                  <div>
                    {t("generate.loadingNoImage")}
                  </div>
                )}
              </h2>
            )
          }

<div className="Divider"></div>
          <div className="FiltersColumn">
            <div className={`FiltersRow ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>

              <div className="ExcludedSection" dir={isRTL ? "rtl" : "ltr"}>
                <div>
                  <TextField
                    className="ExcludeTF"
                    label={t("generate.excludeIngredient")}
                    size="small"
                    {...register("excludedIngredients.0")}
                  />
                </div>
              </div>

              <div className={`Servings ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
                <p>{t("generate.quantitySelector")}</p>
                <select
                  className="QuantitySelector"
                  value={initialQuantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="FiltersDropdown" dir={isRTL ? "rtl" : "ltr"}>
                <Button
                  className="FilterBtn"
                  onClick={() => setFiltersOpen((v) => !v)}
                  variant="contained"
                  endIcon={filtersOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {t("generate.filters")}
                </Button>

                <div className={`FiltersDropdown__panel ${filtersOpen ? "open" : ""}`}>
                  <div className="FiltersDropdown__panelInner">
                    <div><DietaryFilter key={`diet-${filtersResetKey}`} onDietSelect={setDietType} /></div>
                    <div><SugarFilter key={`sugar-${filtersResetKey}`} onSugarLevelSelect={setSugarLevel} /></div>
                    <div><LactoseFilter key={`lac-${filtersResetKey}`} onChange={setHasLactose} /></div>
                    <div><GlutenFilter key={`glu-${filtersResetKey}`} onChange={setHasGluten} /></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
      {
        recipe && (
          <div className="CenterRow">
            <RecipeCard
              recipe={recipe}
              filters={appliedFilters}
              loadImage={loadImage}
            />
          </div>
        )
      }
    </div>
  );
}