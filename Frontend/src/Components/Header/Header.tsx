import { NavLink } from "react-router-dom";
import "./Header.css";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { accountProtection } from "../../Utils/AccountProtection";
import { notify } from "../../Utils/Notify";
import { userService } from "../../Services/UserService";

export function Header() {
  const user = useSelector((state: AppState) => state.user);
  async function logout(): Promise<void> {
    notify.success(`Good bye ${user.firstName} ${user.familyName}`)
    userService.logout();
  }

  return (
    <div className="Header">
      {user && accountProtection.isUser() && (
        <div className="GeneralNavigation">
          <NavLink to="/recipes-screen" className="RecipesScreenLink">My Recipes</NavLink>
            <NavLink to="/home-screen" className="HomeScreenLink">Generate Recipe</NavLink>
        </div>
      )}
      <NavLink to="/about-screen" className="AboutScreenLink">About</NavLink>
      <div className="UserNavigation">
        <>{!user && (
          <NavLink to="/login-screen" className="LoginScreenLink">Login</NavLink>
          )}</>
        {user && accountProtection.isUser() && (
          <>
          <NavLink to="/profile-screen" className="ProfileScreenLink">Profile</NavLink>
          <NavLink to="/login-screen" className="LogoutLink" onClick={logout}>Logout</NavLink>
          </>
        )}
      </div>
    </div>
  );
}
