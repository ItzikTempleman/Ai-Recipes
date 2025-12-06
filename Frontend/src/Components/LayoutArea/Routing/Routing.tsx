import { Navigate, Route, Routes } from "react-router-dom";
import { Page404 } from "../Page404/Page404";
import { RecipeInfoScreen } from "../../Screens/RecipeInfoScreen/RecipeInfoScreen";
import { LoginScreen } from "../../Screens/AuthScreens/LoginScreen/LoginScreen";
import { RegistrationScreen } from "../../Screens/AuthScreens/RegistrationScreen/RegistrationScreen";
import { HomeScreen } from "../../Screens/HomeScreen/HomeScreen";
import { AboutScreen } from "../../Screens/AboutScreen/AboutScreen";
import { ProfileScreen } from "../../Screens/ProfileScreen/ProfileScreen";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { GenerateScreen } from "../../Screens/GenerateScreen/GenerateScreen";

export function Routing() {
    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = user && localStorage.getItem("token");
    return (
        <div>
            <Routes>
                <Route path="/" element={<Navigate to={isLoggedIn ? "/home-screen" : "/login-screen"} replace />} />
                <Route path="*" element={<Page404 />} />
                <Route path="/generate-screen" element={isLoggedIn ? <GenerateScreen /> : <Navigate to="/login-screen" replace />} />
                <Route path="/about-screen" element={<AboutScreen />} />
                <Route path="/home-screen" element={isLoggedIn ? <HomeScreen /> : <Navigate to="/login-screen" replace />} />
                <Route path="/recipe/:id" element={isLoggedIn ? <RecipeInfoScreen /> : < Navigate to="/login-screen" replace />} />
                <Route path="/login-screen" element={isLoggedIn ? <Navigate to="/home-screen" replace /> : <LoginScreen />} />
                <Route path="/registration-screen" element={isLoggedIn ? <Navigate to="/home-screen" replace /> : <RegistrationScreen />} />
                <Route path="/profile-screen" element={isLoggedIn ? <ProfileScreen /> : <Navigate to="/login-screen" replace />} />
            </Routes>
        </div>
    );
}
