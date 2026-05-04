import { useNavigate } from "react-router-dom";
import "./RecipeListItem.css";
import { RecipeModel } from "../../../Models/RecipeModel";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import { recipeService } from "../../../Services/RecipeService";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { difficultyToString } from "../../../Utils/Utils";
import { normalizeAppLanguage, translateRecipeCategory } from "../../../Utils/TranslateCat";

type RecipeListContext = "default" | "suggestions" | "likes";

type RecipeProps = {
  recipe: RecipeModel;
  context?: RecipeListContext;
};

export function RecipeListItem({ recipe, context = "default" }: RecipeProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.user);
  const likes = useSelector((state: AppState) => state.likes);

  const isSuggestions = context === "suggestions";
  const userId = user?.id;
  const canDelete = !!user && context !== "suggestions" && context !== "likes";
  const isLiked = !!likes.find(
    (like) => like.userId === userId && like.recipeId === recipe.id
  );

  const hasHebrew = (s: unknown) => /[\u0590-\u05FF]/.test(String(s ?? ""));
  const titleIsHebrew = hasHebrew(recipe.title);
  const titleDir: "rtl" | "ltr" = titleIsHebrew ? "rtl" : "ltr";
  const titleClass = titleIsHebrew ? "rtl" : "ltr";

  const isRTL = (i18n.language ?? "").startsWith("he");
  const uiDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";
  const uiClass = isRTL ? "rtl" : "ltr";

  const selectedLanguage = normalizeAppLanguage(i18n.language);

  async function moveToInfo(): Promise<void> {
    navigate("/recipe/" + recipe.id);
  }

  async function deleteRecipe(id: number) {
    await recipeService.deleteRecipe(id);
  }

  async function handleLikeState(): Promise<void> {
    if (!user) return;
    if (isLiked) await recipeService.unLikeRecipe(recipe.id);
    else await recipeService.likeRecipe(recipe.id);
  }

  function stopCardClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className="recipe-list-item" onClick={moveToInfo}>
      <div className="recipe-media">
        <img
          className="card-image"
          src={recipe.imageUrl ? recipe.imageUrl : "/no-image.png"}
        />

        <div className="top-right-actions">
          {user && !isSuggestions && (
            <IconButton
              className="list-item-like-btn"
              onClick={(e) => {
                stopCardClick(e);
                handleLikeState();
              }}
            >
              {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          )}

          {canDelete && (
            <IconButton
              className="delete-btn"
              onClick={(e) => {
                stopCardClick(e);
                deleteRecipe(recipe.id);
              }}
            >
              <DeleteOutlineOutlinedIcon />
            </IconButton>
          )}
        </div>
      </div>

      <h3
        className={`recipe-name ${titleClass} ${isSuggestions ? "suggestions" : ""}`}
        dir={titleDir}
        lang={titleIsHebrew ? "he" : "en"}
      >
        {recipe.title}
      </h3>

      <span className="list-item-categories">
        {recipe.categories.map((c, i) => (
          <h3 key={i} className="category-list-item">
            {translateRecipeCategory(c, selectedLanguage)}
            {i < recipe.categories.length - 1 && <span className="separator">|</span>}
          </h3>
        ))}
      </span>

      <div className={`card-footer ${uiClass}`} dir={uiDir} lang={isRTL ? "he" : "en"}>
        <div className={`time-and-hardship-level ${uiClass}`}>
          <div className="time-row">
            <AccessTimeIcon className="clock-icon" />
            <span>
              {recipe.prepTime} {t("units.minuteShort")} •{" "}
              {difficultyToString(recipe.difficultyLevel)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}