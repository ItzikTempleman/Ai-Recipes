import { useTitle } from "../../../Utils/Utils";
import "./HistoryScreen.css";
import { RecipeListItem } from "../RecipeListItem/RecipeListItem";
import { RecipeModel } from "../../../Models/RecipeModel";

type Prop = {
    list: RecipeModel[];
}

export function HistoryScreen({
    list
}: Prop) {
    useTitle("History");

    return (
        <div className="HistoryScreen">
            {
                list.map((recipe) => (
                    <RecipeListItem key={recipe.id ?? recipe.title} recipe={recipe} />
                ))
            }
        </div>

    );
}

