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
import { Settings } from "@mui/icons-material";

export function Routing() {
    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = user && localStorage.getItem("token");
    return (
        <div>
            <Routes>
                <Route path="/" element={<HomeScreen/>} />
                <Route path="*" element={<Page404 />} />
                <Route path="/generate-screen" element={ <GenerateScreen /> } />
                <Route path="/about-screen" element={<AboutScreen />} />
                <Route path="/home-screen" element={<HomeScreen /> } />
                <Route path="/recipe/:id" element={isLoggedIn ? <RecipeInfoScreen /> : < Navigate to="/home-screen" replace />} />
                <Route path="/login-screen" element={ <LoginScreen />} />
                <Route path="/registration-screen" element={ <RegistrationScreen />} />
                <Route path="/profile-screen" element={isLoggedIn ? <ProfileScreen /> : <Navigate to="/home-screen" replace />} />
                <Route path="/settings" element={ <Settings /> }/>
            </Routes>
        </div>
    );
}
