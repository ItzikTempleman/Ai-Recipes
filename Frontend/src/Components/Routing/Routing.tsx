import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../Page404/Page404";
import { AboutScreen } from "../AboutScreen/AboutScreen";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { HomeScreen } from "../HomeScreen/HomeScreen";
import { LoginScreen } from "../LoginScreen/LoginScreen";
import { RecipeInfoScreen } from "../RecipeInfoScreen/RecipeInfoScreen";
import { RegistrationScreen } from "../RegistrationScreen/RegistrationScreen";
import { ProfileScreen } from "../ProfileScreen/ProfileScreen";
import { PdfScreen } from "../PdfScreen/PdfScreen";
import { LikesScreen } from "../LikesScreen/LikesScreen";
import { RecipeInputScreen } from "../RecipeInputScreen/RecipeInputScreen";
import { ResetPasswordScreen } from "../ResetPasswordScreen/ResetPasswordScreen";
import { PrivacyPolicy } from "../PrivacyPolicy/PrivacyPolicy";

export function Routing() {
    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = user && localStorage.getItem("token");
    return (
        <div>
            <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="*" element={<Page404 />} />
                <Route path="/generate" element={<RecipeInputScreen />} />
                <Route path="/about" element={<AboutScreen />} />
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/recipe/:id" element={isLoggedIn ? <RecipeInfoScreen /> : < Navigate to="/home" replace />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/registration" element={<RegistrationScreen />} />
                <Route path="/profile" element={isLoggedIn ? <ProfileScreen /> : <Navigate to="/home" replace />} />
                <Route path="/share-render/:recipeId" element={<PdfScreen />} />
                <Route path="/likes" element={<LikesScreen />} />
                <Route path="/reset" element={<ResetPasswordScreen />} />
                     <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Routes>
        </div>
    );
}
