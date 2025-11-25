import { NavLink } from "react-router-dom";
import "./Header.css";

export function Header() {

  return (
    <div className="Header">

      <div className="WebsiteTitle"><h1>Ai Recipes</h1></div>

      <div className="GeneralNavigation">
        <NavLink to="/home-screen" className="HomeScreenLink">Home</NavLink>
        <NavLink to="/about-screen" className="AboutScreenLink">About</NavLink>
        <NavLink to="/recipes-screen" className="RecipesScreenLink">Recipes</NavLink>
      </div>

      <div className="UserNavigation">
        <NavLink to="/login-screen" className="LoginScreenLink">Login</NavLink>
        <NavLink to="/registration-screen" className="RegistrationScreenLink">Registration</NavLink>
        <NavLink to="/profile-screen" className="ProfileScreenLink">Profile</NavLink>
      </div>

    </div>
  );
}