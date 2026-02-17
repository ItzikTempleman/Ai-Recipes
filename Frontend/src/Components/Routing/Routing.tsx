import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../user-components/Page404/Page404";
import { AboutScreen } from "../user-components/AboutScreen/AboutScreen";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { GenerateRoute, HomeScreen } from "../recipe-components/HomeScreen/HomeScreen";
import { LoginScreen } from "../user-components/LoginScreen/LoginScreen";
import { RecipeInfoScreen } from "../recipe-components/RecipeInfoScreen/RecipeInfoScreen";
import { RegistrationScreen } from "../user-components/RegistrationScreen/RegistrationScreen";
import { ProfileScreen } from "../user-components/ProfileScreen/ProfileScreen";
import { LikesScreen } from "../recipe-components/LikesScreen/LikesScreen";
import { PrivacyPolicy } from "../user-components/PrivacyPolicy/PrivacyPolicy";
import { DataDeletion } from "../user-components/DataDeletion/DataDeletion";
import { ResetPasswordScreen } from "../user-components/ResetPasswordScreen/ResetPasswordScreen";
import { PdfScreen } from "../recipe-components/PdfScreen/PdfScreen";

export function Routing() {

    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = user && localStorage.getItem("token");
    
    return (
        <div>
            <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/generate" element={<GenerateRoute />} />
                <Route path="/about" element={<AboutScreen />} />
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/recipe/:id" element={<RecipeInfoScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/registration" element={<RegistrationScreen />} />
                <Route path="/profile" element={isLoggedIn ? <ProfileScreen /> : <Navigate to="/home" replace />} />
                <Route path="/share-render/:recipeId" element={<PdfScreen />} />
                <Route path="/likes" element={<LikesScreen />} />
                <Route path="/reset" element={<ResetPasswordScreen />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/data-deletion" element={<DataDeletion />} />
                <Route path="/404" element={<Page404 />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </div>
    );
}

