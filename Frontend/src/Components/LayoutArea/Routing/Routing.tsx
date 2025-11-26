import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../Page404/Page404";

import { RecipeInfoScreen } from "../../Screens/RecipeInfoScreen/RecipeInfoScreen";

import { LoginScreen } from "../../Screens/AuthScreens/LoginScreen/LoginScreen";
import { RegistrationScreen } from "../../Screens/AuthScreens/RegistrationScreen/RegistrationScreen";


import { HomeScreen } from "../../Screens/HomeScreen/HomeScreen";
import { RecipesScreen } from "../../Screens/RecipesScreen/RecipesScreen";
import { AboutScreen } from "../../Screens/AboutScreen/AboutScreen";
import { ProfileScreen } from "../../Screens/ProfileScreen/ProfileScreen";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { accountProtection } from "../../../Utils/AccountProtection";


export function Routing() {

      const user = useSelector((state: AppState) => state.user);
  const isLoggedIn = !!user && accountProtection.isUser();
  
    return (
        <div>
            <Routes>
                
                <Route path="/" element={<Navigate to={isLoggedIn
                ? "/home-screen" : "/login-screen"}></Navigate>} />
                <Route path="*" element={<Page404 />} />
                <Route path={isLoggedIn
                ? "/home-screen" : "/login-screen"} element={    isLoggedIn
            ? <HomeScreen  />
            : <LoginScreen  />} />
                <Route path="/about-screen" element={<AboutScreen />} />
                <Route path="/recipes-screen" element={<RecipesScreen />} />
                <Route path="/recipe/:id" element={<RecipeInfoScreen />} />
                <Route path="/login-screen" element={<LoginScreen />} />
                <Route path="/registration-screen" element={<RegistrationScreen />} />
                <Route path="/profile-screen" element={<ProfileScreen />} />
            </Routes>
        </div>
    );
}
