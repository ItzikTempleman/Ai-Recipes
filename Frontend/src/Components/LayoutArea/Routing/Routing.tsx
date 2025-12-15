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
                <Route path="/" element={<HomeScreen/>} />
                <Route path="*" element={<Page404 />} />
                <Route path="/generate" element={ <GenerateScreen /> } />
                <Route path="/about" element={<AboutScreen />} />
                <Route path="/home" element={<HomeScreen /> } />
                <Route path="/recipe/:id" element={isLoggedIn ? <RecipeInfoScreen /> : < Navigate to="/home" replace />} />
                <Route path="/login" element={ <LoginScreen />} />
                <Route path="/registration" element={ <RegistrationScreen />} />
                <Route path="/profile" element={isLoggedIn ? <ProfileScreen /> : <Navigate to="/home" replace />} />
        
            </Routes>
        </div>
    );
}
