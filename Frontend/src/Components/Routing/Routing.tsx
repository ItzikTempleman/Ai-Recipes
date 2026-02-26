import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../UserComponents/Page404/Page404";
import { AboutScreen } from "../UserComponents/AboutScreen/AboutScreen";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";

import { LoginScreen } from "../UserComponents/LoginScreen/LoginScreen";

import { RegistrationScreen } from "../UserComponents/RegistrationScreen/RegistrationScreen";
import { ProfileScreen } from "../UserComponents/ProfileScreen/ProfileScreen";

import { PrivacyPolicy } from "../UserComponents/PrivacyPolicy/PrivacyPolicy";
import { DataDeletion } from "../UserComponents/DataDeletion/DataDeletion";
import { ResetPasswordScreen } from "../UserComponents/ResetPasswordScreen/ResetPasswordScreen";

import { GenerateRoute } from "../../Utils/DialogRoute";
import { HomeScreen } from "../RecipeComponents/HomeScreen/HomeScreen";
import { RecipeInfoScreen } from "../RecipeComponents/RecipeInfoScreen/RecipeInfoScreen";
import { PdfScreen } from "../RecipeComponents/PdfScreen/PdfScreen";

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
        
                <Route path="/reset" element={<ResetPasswordScreen />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/data-deletion" element={<DataDeletion />} />
                <Route path="/404" element={<Page404 />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </div>
    );
}

