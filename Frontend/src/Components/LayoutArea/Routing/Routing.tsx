import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../Page404/Page404";

import { InfoScreen } from "../../Screens/RecipeInfoScreen/InfoScreen";

import { LoginScreen } from "../../Screens/AuthScreens/LoginScreen/LoginScreen";
import { RegistrationScreen } from "../../Screens/AuthScreens/RegistrationScreen/RegistrationScreen";


import { HomeScreen } from "../../Screens/HomeScreen/HomeScreen";
import { RecipesScreen } from "../../Screens/RecipesScreen/RecipesScreen";
import { AboutScreen } from "../../Screens/AboutScreen/AboutScreen";
import { ProfileScreen } from "../../Screens/ProfileScreen/ProfileScreen";


export function Routing() {

    return (
        <div>
            <Routes>
                <Route path="/" element={<Navigate to="/create-screen" />} />
                <Route path="*" element={<Page404 />} />
                <Route path="/home-screen" element={<HomeScreen />} />
                <Route path="/about-screen" element={<AboutScreen />} />
                <Route path="/recipes-screen" element={<RecipesScreen />} />
                <Route path="/recipe/:id" element={<InfoScreen />} />
                <Route path="/login-screen" element={<LoginScreen />} />
                <Route path="/registration-screen" element={<RegistrationScreen />} />
                <Route path="/profile-screen" element={<ProfileScreen />} />
            </Routes>
        </div>
    );
}
