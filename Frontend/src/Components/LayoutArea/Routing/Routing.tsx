import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../Page404/Page404";
import { RecipeScreen } from "../../ScreensArea/RecipeScreen/RecipeScreen";
import { HistoryScreen } from "../../ScreensArea/HistoryScreen/HistoryScreen";

export function Routing() {

    return (
        <div>
            <Routes>
                <Route path="/" element={<Navigate to="/recipe-screen" />} />
                <Route path="*" element={<Page404/>} />
                <Route path="/recipe-screen" element={<RecipeScreen/>} />
                <Route path="/history-screen" element={<HistoryScreen/>} />
            </Routes>
        </div>
    );
}
