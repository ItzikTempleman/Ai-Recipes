import {
  IconButton,
  TextField,
  CircularProgress,
  Box,
  Button,
  DialogContent,
  InputAdornment,
} from "@mui/material";
import { useForm } from "react-hook-form";
import "./RecipeInputDialog.css";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { notify } from "../../../Utils/Notify";
import {
  DietaryRestrictions,
  GlutenRestrictions,
  InputModel,
  LactoseRestrictions,
  RecipeState,
  SugarRestriction,
} from "../../../Models/RecipeModel";
import { resetGenerated } from "../../../Redux/RecipeSlice";
import { AppState } from "../../../Redux/Store";
import NoPhotographyIcon from '@mui/icons-material/NoPhotography';
import CameraEnhanceIcon from '@mui/icons-material/CameraEnhance';
import TuneIcon from "@mui/icons-material/Tune";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import type { Filters } from "../RecipeDataContainer/RecipeDataContainer";
import { DietaryFilter, GlutenFilter, LactoseFilter, SugarFilter } from "../../../Utils/Filtering";
import { recipeSocketService } from "../../../Services/RecipeSocketService";
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

type Props = {
  onDone: () => void;
  onFiltersReady?: (filters: Filters) => void;

};

type RecipeStateType = {
  recipes: RecipeState;
};

export function RecipeInputDialog({ onDone, onFiltersReady }: Props) {


  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.user);

  const { register, handleSubmit, reset } = useForm<InputModel>({
    defaultValues: {
      query: "",
      excludedIngredients: [""],
    },
  });

  const [filtersResetKey, setFiltersResetKey] = useState(0);
  const [sugarLevel, setSugarLevel] = useState<SugarRestriction>(SugarRestriction.DEFAULT);
  const [hasImage, setHasImage] = useState(false);
  const [hasLactose, setHasLactose] = useState(LactoseRestrictions.DEFAULT);
  const [hasGluten, setHasGluten] = useState(GlutenRestrictions.DEFAULT);
  const [dietType, setDietType] = useState(DietaryRestrictions.DEFAULT);
  const filtersWrapRef = useRef<HTMLDivElement | null>(null);

  const { t, i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(() => i18n.language?.startsWith("he"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialQuantity, setQuantity] = useState(1);

  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipeHasData = Boolean(current?.title);

  const didResetOnEnterRef = useRef(false);
  const didResetAfterGenerateRef = useRef(false);


  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(lng?.startsWith("he"));
    i18n.on("languageChanged", onLangChange);

    if (user && !loading && !didResetOnEnterRef.current && !recipeHasData) {
      dispatch(resetGenerated());
      didResetOnEnterRef.current = true;
    }

    if (loading) {
      didResetAfterGenerateRef.current = false;
    } else if (recipeHasData && !didResetAfterGenerateRef.current) {
      setFiltersOpen(false);
      setQuantity(1);
      setHasImage(false);
      setSugarLevel(SugarRestriction.DEFAULT);
      setHasLactose(LactoseRestrictions.DEFAULT);
      setHasGluten(GlutenRestrictions.DEFAULT);
      setDietType(DietaryRestrictions.DEFAULT);
      setFiltersResetKey((k) => k + 1);
      reset({ query: "", excludedIngredients: [""] });

      didResetAfterGenerateRef.current = true;
    }

    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n, dispatch, user, loading, recipeHasData, reset]);

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;

      dispatch(resetGenerated());
      setFiltersOpen(false);

      const raw = recipeTitle.excludedIngredients?.[0] ?? "";
      const excludedList = raw
        .split(/[\n,]+/g)
        .map((s) => s.trim())
        .filter(Boolean);

      const used: Filters = { sugarLevel, hasLactose, hasGluten, dietType };
      onFiltersReady?.(used);

      recipeSocketService.generateRecipe({
        query: recipeTitle.query,
        quantity: initialQuantity,
        hasImage,
        sugarRestriction: sugarLevel,
        lactoseRestriction: hasLactose,
        glutenRestriction: hasGluten,
        dietaryRestriction: dietType,
        queryRestrictions: excludedList,
      });


    } catch (err: unknown) {
      notify.error(err);
      onDone();
    }
  }

  return (
    <div
      className={`RecipeInputDialog ${recipeHasData ? "RecipeInputScreenWithPreviousData" : ""}`}>
      {!recipeHasData && (
        <DialogContent>

          <div className="GenerateContainer">
            <form onSubmit={handleSubmit(send)} autoComplete="off">

              <div className={`RecipeTextFieldBar ${isRTL ? "rtl" : "ltr"}`}>
                <TextField
                  dir={isRTL ? "rtl" : "ltr"}
                  className="RecipeTextField"
                  size="small"
                  placeholder={t("generate.labelGenerate")}
                  {...register("query", { required: `${t("generate.requiredTitle")}` })}
                  disabled={loading}
                  InputProps={{
                    dir: isRTL ? "rtl" : "ltr",
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          className={`GenerateImageSelector ${hasImage ? "on" : "off"}`}
                          onClick={() => setHasImage((v) => !v)}
                          disabled={loading}
                          edge="end"
                        >
                          {hasImage ? <CameraEnhanceIcon /> : <NoPhotographyIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ style: { textAlign: isRTL ? "right" : "left" } }}
                  InputLabelProps={{
                    style: { direction: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" },
                  }}
                />
              </div>
              <div className="ExcludeGroup" dir={isRTL ? "rtl" : "ltr"}>
                <TextField
                  className="ExcludeTextField"
                  placeholder={t("generate.excludeIngredient")}
                  size="small"
                  {...register("excludedIngredients.0")}
                />
              </div>
              {error && <div className="ErrorText">{error}</div>}

              <div className="FiltersSectionContainer">
                <div className={`FilterBar ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
                  <div className="FiltersDropdown" ref={filtersWrapRef} dir={isRTL ? "rtl" : "ltr"}>
                    <Button
                      className="FilterBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiltersOpen((v) => !v);
                      }}
                      variant="contained"
                      startIcon={<TuneIcon />}
                      endIcon={filtersOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    >
                      {t("generate.filters")}
                    </Button>

                    <div className={`PanelState ${filtersOpen ? "open" : "closed"}`}>
                      <div
                        className="FilterPanelInnerSection"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div>
                          <p className="dietaryPreferences">{t("filters.dietaryPreferences")}</p>
                          <DietaryFilter key={`diet-${filtersResetKey}`} onDietSelect={(v) => setDietType(v)} />
                        </div>

                        <div>
                          <p className="healthGoals">{t("filters.healthGoals")}</p>
                          <SugarFilter key={`sugar-${filtersResetKey}`} onSugarLevelSelect={(v) => setSugarLevel(v)} />
                        </div>

                        <div>
                          <LactoseFilter key={`lac-${filtersResetKey}`} onChange={(v) => setHasLactose(v)} />
                        </div>

                        <div>
                          <GlutenFilter key={`glu-${filtersResetKey}`} onChange={(v) => setHasGluten(v)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ExcludeGroup" dir={isRTL ? "rtl" : "ltr"}>


                    <div className={`Servings ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
                      <p>{t("generate.quantitySelector")}</p>
                      <select
                        className="QuantitySelector"
                        value={initialQuantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {loading && (
                <div>
                  {hasImage ? (
                    <h2 className="ImageLoadingMessage">
                      {t("generate.loadingWithImage")} {t("generate.loadingWithImageLowerMessage")}
                    </h2>
                  ) : (
                    <h2 className="LoadingWithoutImage">{t("generate.loadingNoImage")}</h2>
                  )}
                </div>
              )}

              {loading ? (
                <div className="ProgressBar">
                  <Box>
                    <CircularProgress size={50} thickness={4} />
                  </Box>
                  
                  <IconButton className="MinimizeBtn"
                    onClick={() => onDone()}>
                    <CloseFullscreenIcon />
                  </IconButton>

                  <Button
                    className="CancelGenerationBtn"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      recipeSocketService.cancelRecipeGeneration();
                      onDone();
                    }}
                  >
                    {t("generate.cancel")}
                  </Button>
                </div>
              ) : (
                <Button className="GenerateRecipeBtn" variant="contained" disableElevation type="submit" disabled={loading}>
                  {t("homeScreen.generate")}
             
                </Button>
              )}
            </form>
          </div>
        </DialogContent>
      )}
    </div>
  );
}