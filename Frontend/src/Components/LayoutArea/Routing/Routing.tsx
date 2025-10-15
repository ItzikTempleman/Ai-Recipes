import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../Page404/Page404";
import { NewScreen } from "../../NewRecipeScreen/NewScreen";
import { InfoScreen } from "../../InfoScreen/InfoScreen";
import { RecipeList } from "../../RecipeList/RecipeList";


export function Routing() {

    return (
        <div>
            <Routes>
                <Route path="/" element={<Navigate to="/create-screen" />} />
                <Route path="*" element={<Page404/>} />
                <Route path="/create-screen" element={<NewScreen/>} />
                <Route path="/all-recipes-screen" element={<RecipeList/>} />
                <Route path="/recipe/:id" element={<InfoScreen />} />
            </Routes>
        </div>
    );
}
