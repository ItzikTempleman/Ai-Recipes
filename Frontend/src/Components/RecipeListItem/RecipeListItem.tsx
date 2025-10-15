import { useNavigate } from "react-router-dom";
import "./RecipeListItem.css";
import { RecipeModel } from "../../Models/RecipeModel";
import { Button } from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

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


    return (
        <div className={cardClassName}>
            {recipe.imageUrl && (
                <img className="CardImage" src={recipe.imageUrl} />

            )}
            <div className="CardTitleContainer">
                <h3 className="CardTitle">
                    {recipe.title}
                </h3>
                       <Button className="MoreInfoBtn"
                        onClick={moveToInfo}
                        variant="contained">
                        More info
                        <ArrowForwardIosIcon />
                    </Button>
            </div>
        </div>
    );
}
