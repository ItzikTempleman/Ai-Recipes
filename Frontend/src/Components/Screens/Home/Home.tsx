import { useTitle } from "../../../Utils/UseTitle";
import { RecipeSwitch } from "../../Helpers/RecipeSwitch";
import "./Home.css";

export function Home() {
    useTitle("Home");

    return (
        <div className="Home">
             <h2 className="SearchTitle">Generate recipe</h2>
             <h4 className="SearchTitleBottomLine">(any language)</h4>
            <RecipeSwitch />
        </div>
    );
}

