import { useNavigate } from "react-router-dom";
import "./RecipeListItem.css";
import { RecipeModel } from "../../Models/RecipeModel";
import { Button } from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { recipeService } from "../../Services/RecipeService";
import { getCountryFlag } from "../../Utils/CountryFlag";
import { useTranslation } from "react-i18next";

type RecipeProps = {
    recipe: RecipeModel;
}

export function RecipeListItem({ recipe }: RecipeProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    async function moveToInfo(): Promise<void> {
        navigate("/recipe/" + recipe.id);
    }

    async function deleteRecipe(id: number) {
        await recipeService.deleteRecipe(id)
    }

    return (
        <div className="RecipeListItem">
            <IconButton className="DeleteIcon"
                onClick={() => {
                    deleteRecipe(recipe.id)
                }}>
                <DeleteIcon />
            </IconButton>
            <img className="CardImage" src={recipe.imageUrl ? recipe.imageUrl : "/no-image.png"} />
                   <span className="CountryFlag">{getCountryFlag(recipe.countryOfOrigin)}</span>
            <div className="CardTitleContainer">
                <h3 className="CardTitle">{recipe.title}</h3>
                <div>
                    <Button className="MoreInfoBtn"
                        onClick={moveToInfo}
                        variant="contained">
                      {t("recipeUi.showRecipe")}
                        <ArrowForwardIosIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
}
