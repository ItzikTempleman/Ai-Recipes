import { useNavigate } from "react-router-dom";
import "./RecipeListItem.css";
import { RecipeModel } from "../../Models/RecipeModel";
import { Button } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { recipeService } from "../../Services/RecipeService";
import { useTranslation } from "react-i18next";
import GradeIcon from '@mui/icons-material/Grade';
import GradeOutlinedIcon from '@mui/icons-material/GradeOutlined';
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { ArrowForwardIos } from "@mui/icons-material";


type RecipeProps = {
    recipe: RecipeModel;
}

export function RecipeListItem({ recipe }: RecipeProps) {
const { t } = useTranslation();

    const navigate = useNavigate();

    const user = useSelector((state: AppState) => state.user);
    const likes = useSelector((state: AppState) => state.likes);
    const userId = user?.id;
    const isLiked = !!likes.find(
        (like) => like.userId === userId && like.recipeId === recipe.id
    );
    async function moveToInfo(): Promise<void> {
        navigate("/recipe/" + recipe.id);
    }
    async function deleteRecipe(id: number) {
        await recipeService.deleteRecipe(id)
    }
    async function handleLikeState(): Promise<void> {
        if (!user) return;
        if (isLiked) {
            await recipeService.unLikeRecipe(recipe.id);
        } else await recipeService.likeRecipe(recipe.id);
    }

    return (
        <div className="RecipeListItem">
            <img className="CardImage" src={recipe.imageUrl ? recipe.imageUrl : "/no-image.png"} />
            <h3 className="RecipeName">{recipe.title}</h3>
            <div className="TopRightActions">
                {user && (
                    <IconButton className="LikeBtn" onClick={handleLikeState}>
                        {isLiked ? <GradeIcon  /> : <GradeOutlinedIcon />}
                    </IconButton>
                )}
                <IconButton className="DeleteBtn"
                    onClick={() => {
                        deleteRecipe(recipe.id)
                    }}>
                    <DeleteIcon />
                </IconButton>
            </div>
            <Button className="MoreInfoBtn"
                onClick={moveToInfo}
                variant="contained">
                {t("recipeUi.showRecipe")}
                <ArrowForwardIos />
            </Button>
        </div>
    );
}
