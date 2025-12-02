import { NavLink, useLocation } from "react-router-dom";
import "./Header.css";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { accountProtection } from "../../Utils/AccountProtection";
import { notify } from "../../Utils/Notify";
import { userService } from "../../Services/UserService";

export function Header() {
  const user = useSelector((state: AppState) => state.user);

  async function logout(): Promise<void> {
    notify.success(`Good bye ${user.firstName} ${user.familyName}`);
    userService.logout();
  }

  const location = useLocation();
  const isAuthPage = location.pathname === "/login-screen" ||location.pathname === "/registration-screen";
  const isLoggedInUser = !!user && accountProtection.isUser();
  const showLoginLink = !isLoggedInUser && !isAuthPage;
  const showUserLinks = isLoggedInUser;
  const showUserNav = showLoginLink || showUserLinks;

  return (
    <div className="Header">
      {/* Left group – only when logged in */}
      {isLoggedInUser && (
        <div className="GeneralNavigation nav-group">
          <NavLink to="/recipes-screen" 
          className="RecipesScreenLink">
            My Recipes
          </NavLink>
          <NavLink to="/home-screen" 
          className="HomeScreenLink">
            Generate
          </NavLink>
        </div>
      )}

      {/* About is always shown */}
      <div className="CenterNavigation">
        <NavLink to="/about-screen" 
        className="AboutScreenLink">
          About
        </NavLink>
      </div>

      {/* Right group - user actions */}
      {showUserNav && (
        <div className="UserNavigation nav-group">
          {showLoginLink && (
            <NavLink to="/login-screen"
             className="LoginScreenLink">
              Login
            </NavLink>
          )}
          {showUserLinks && (
            <>
              <NavLink to="/profile-screen" 
              className="ProfileScreenLink">
                Profile
              </NavLink>
              <NavLink
                to="/login-screen"
                className="LogoutLink"
                onClick={logout}
              >
                Logout
              </NavLink>
            </>
          )}
        </div>
      )}
    </div>
  );
}
