import { useNavigate } from "react-router-dom";
import "./RecipeListItem.css";
import { RecipeModel } from "../../Models/RecipeModel";
import { Button } from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { recipeService } from "../../Services/RecipeService";
type RecipeProps = {
    recipe: RecipeModel;
}

export function RecipeListItem({ recipe }: RecipeProps) {
    const navigate = useNavigate();

    async function moveToInfo(): Promise<void> {
        navigate("/recipe/" + recipe.id);
    }


    const cardClassName = recipe.imageUrl
        ? "RecipeListItem"
        : "NoImageListItem";

    async function deleteRecipe(id: number) {
        await recipeService.deleteRecipe(id)
    }

    return (
        <div className={cardClassName}>
            {recipe.imageUrl && (
                <img className="CardImage" src={recipe.imageUrl} />

            )}
            <div className="CardTitleContainer">
                <h3 className="CardTitle">
                    {recipe.title}
                </h3>
                <div>
                    <IconButton onClick={() => deleteRecipe(recipe.id)}>
                        <DeleteIcon />
                    </IconButton>

                    <Button className="MoreInfoBtn"
                        onClick={moveToInfo}
                        variant="contained">
                        Show Recipe
                        <ArrowForwardIosIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
}
