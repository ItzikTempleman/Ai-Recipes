import "./RecipeData.css";
import {
  DietaryRestrictions,
  GlutenRestrictions,
  LactoseRestrictions,
  RecipeModel,
  SugarRestriction,
} from "../../Models/RecipeModel";
import { formatAmount, getDifficultyLevel } from "../../Utils/Utils";
import { getCountryFlag } from "../../Utils/CountryFlag";
import { Filters } from "../RecipeCard/RecipeCard";
import RestaurantIcon from "@mui/icons-material/Restaurant";

type RecipeProps = {
  recipe: RecipeModel;
  imageSrc: string;
  filters?: Filters;
};

export function RecipeData({ recipe, imageSrc, filters }: RecipeProps) {
  const difficulty = getDifficultyLevel(recipe.difficultyLevel);
  const ingredients = recipe.data?.ingredients ?? [];
  const instructions = recipe.data?.instructions ?? [];
  const isRTL = /[\u0590-\u05FF]/.test(instructions.join(" "));

  const normalizedIngredients = (() => {
    const out: typeof ingredients = [];

    for (const line of ingredients) {
      const ingredientText = String((line as any)?.ingredient ?? "").trim();
      const rawAmount = (line as any)?.amount;
      const amountText =
        rawAmount === null || rawAmount === undefined ? "" : String(rawAmount).trim();

      if (!ingredientText) continue;
      if (!amountText && out.length > 0) {
        (out[out.length - 1] as any).ingredient = `${String(
          (out[out.length - 1] as any).ingredient
        ).trim()}, ${ingredientText}`;
        continue;
      }

      out.push(line);
    }

    return out;
  })();

  const sugarText: Record<number, string> = {
    [SugarRestriction.DEFAULT]: "Regular sugar",
    [SugarRestriction.LOW]: "Low sugar",
    [SugarRestriction.NONE]: "Sugar free",
  };

  const lactoseText: Record<number, string> = {
    [LactoseRestrictions.DEFAULT]: "Regular milk",
    [LactoseRestrictions.NONE]: "Lactose free",
  };

  const glutenText: Record<number, string> = {
    [GlutenRestrictions.DEFAULT]: "Regular gluten",
    [GlutenRestrictions.NONE]: "Gluten free",
  };

  const dietText: Record<number, string> = {
    [DietaryRestrictions.DEFAULT]: "No diet restriction",
    [DietaryRestrictions.VEGAN]: "Vegan",
    [DietaryRestrictions.KOSHER]: "Kosher",
    [DietaryRestrictions.HALAL]: "Halal",
  };

  const filterBadges = !filters
    ? []
    : ([
        filters.sugarLevel !== SugarRestriction.DEFAULT
          ? sugarText[filters.sugarLevel]
          : null,
        filters.hasLactose !== LactoseRestrictions.DEFAULT
          ? lactoseText[filters.hasLactose]
          : null,
        filters.hasGluten !== GlutenRestrictions.DEFAULT
          ? glutenText[filters.hasGluten]
          : null,
        filters.dietType !== DietaryRestrictions.DEFAULT
          ? dietText[filters.dietType]
          : null,
      ].filter(Boolean) as string[]);

  return (
    <div className="RecipeData">
      <h2 className={`RecipeTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {recipe.title}
      </h2>

      <p className={`Description ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {recipe.description}
      </p>

      {imageSrc && (
        <img
          className="RecipeImage"
          src={imageSrc}
          alt={recipe.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "";
          }}
        />
      )}

      {filterBadges.length > 0 && <div className="FiltersRow">{filterBadges.join(" · ")}</div>}

      <div className="RecipeExtraDataContainer">
        <div className="CaloryParent">
          <p>Calories</p>
          <div className="CaloriesDiv">
            <img className="CaloriesIcon" src="/calories.png" />
            <div className="CaloriesInnerDiv">
              <p>{recipe.calories}</p>
              <p>kcal</p>
            </div>
          </div>
        </div>

        <div className="SugarParent">
          <p>Sugar</p>
          <div className="SugarAmountDiv">
            <img className="SugarIcon" src="/sugar.png" alt="sugar" />
            <div className="SugarAmountInnerDiv">
              <p>{Number(recipe.totalSugar) === 0 ? "None" : `${recipe.totalSugar}`}</p>
              <p>{Number(recipe.totalSugar) === 0 ? " " : "tbs | 100g"}</p>
            </div>
          </div>
        </div>

        <div className="ProteinParent">
          <p>Protein</p>
          <div className="ProteinAmountDiv">
            <img className="ProteinIcon" src="/protein.png" alt="protein" />
            <div className="ProteinInnerDiv">
              <p>{recipe.totalProtein}g </p>
              <p> | 100g</p>
            </div>
          </div>
        </div>

        <div className="HealthParent">
          <p>Health</p>
          <div className="HealthLevelDiv">
            <img className="HealthIcon" src="/health.png" alt="health" />
            <div className="HealthLevelInnerDiv">
              <p>{recipe.healthLevel}</p>
              <p> / 10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="RecipeExtraDataContainer">
        <div className="AmountParent">
          <RestaurantIcon fontSize="small" />
          <p>x {recipe.amountOfServings}</p>
        </div>

        <div className="PrepTimeParent">
          <img className="ExtraDataImg" src={"/clock.png"} alt="prep time" />
          <p>{recipe.prepTime} m </p>
        </div>

        <div className="CountryNameParent">
          <span className="ExtraDataFlag">{getCountryFlag(recipe.countryOfOrigin)}</span>
          <p>{recipe.countryOfOrigin}</p>
        </div>

        <div className="DifficultyParent">
          <img className="ExtraDataImg" src={difficulty.icon} alt="difficulty" />
          <p>{difficulty.label}</p>
        </div>
      </div>

      <div className={`IngredientsList ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <h2 className={`IngredientsTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
          {isRTL ? "מצרכים" : "Ingredients"}
        </h2>

        {normalizedIngredients.map((line, index) => (
          <div key={index} className="IngredientRow">
            <span className="IngredientName">{(line as any).ingredient}</span>
            <span className="IngredientAmount">{formatAmount((line as any).amount) ?? ""}</span>
          </div>
        ))}
      </div>

      <div className="InstructionsList">
        <h2 className={`InstructionsTitle ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
          {isRTL ? "הוראות הכנה" : "Instructions"}
        </h2>

<ol
  className={`instructions-list ${isRTL ? "rtl" : "ltr"}`}
  dir={isRTL ? "rtl" : "ltr"}
>
  {instructions
    .map((s) => String(s ?? "").trim())
    .filter((s) => s.length > 0)
    .map((step, index, arr) => (
      <li key={index}>
        {step}
        {index !== arr.length - 1 && <hr className="divider" />}
      </li>
    ))}
</ol>
      </div>
    </div>
  );
}
