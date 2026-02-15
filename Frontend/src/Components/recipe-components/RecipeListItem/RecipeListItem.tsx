import { useNavigate } from "react-router-dom";
import "./RecipeListItem.css";
import { RecipeModel } from "../../../Models/RecipeModel";
import { Button } from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import { recipeService } from "../../../Services/RecipeService";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";

type RecipeListContext = "default" | "suggestions";

type RecipeProps = {
  recipe: RecipeModel;
  context?: RecipeListContext;
};

export function RecipeListItem({ recipe, context = "default" }: RecipeProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.user);
  const likes = useSelector((state: AppState) => state.likes);

  const isSuggestions = context === "suggestions";
  const userId = user?.id;

  const isLiked = !!likes.find(
    (like) => like.userId === userId && like.recipeId === recipe.id
  );

  const hasHebrew = (s: unknown) => /[\u0590-\u05FF]/.test(String(s ?? ""));
  const titleIsHebrew = hasHebrew(recipe.title);
  const titleDir: "rtl" | "ltr" = titleIsHebrew ? "rtl" : "ltr";
  const titleClass = titleIsHebrew ? "rtl" : "ltr";

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
    <div className="RecipeListItem" onClick={moveToInfo} >
      <div className="RecipeMedia">
        <img
          className="CardImage"
          src={recipe.imageUrl ? recipe.imageUrl : "/no-image.png"}

        />

        <div className="TopRightActions">
          {user && !isSuggestions && (
            <IconButton className="LikeBtn" onClick={(e) => {
              stopCardClick(e);
              handleLikeState();
            }}>
              {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          )}

          {!isSuggestions && (
            <IconButton className="DeleteBtn" onClick={(e) => {
              stopCardClick(e);
              deleteRecipe(recipe.id);
            }}>
              <DeleteOutlineOutlinedIcon />
            </IconButton>
          )}
        </div>

        <h3 className={`RecipeName ${titleClass}  ${isSuggestions ? "suggestions" : ""}`} dir={titleDir} lang={titleIsHebrew ? "he" : "en"}>
          {recipe.title}
        </h3>

        <Button className="MoreInfoBtn FloatingBtn" onClick={moveToInfo} variant="contained">
          {t("recipeUi.showRecipe")}
        </Button>
      </div>
    </div>
  );

}
