import { NavLink, useLocation } from "react-router-dom";
import "./Header.css";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { notify } from "../../Utils/Notify";
import { userService } from "../../Services/UserService";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import LibraryAdd from "@mui/icons-material/LibraryAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import Info from "@mui/icons-material/Info";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

export function Header() {
  const user = useSelector((state: AppState) => state.user);

  async function logout(): Promise<void> {
    notify.success(`Good bye ${user.firstName} ${user.familyName}`);
    userService.logout();
  }

  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login-screen" ||
    location.pathname === "/registration-screen";

  const isLoggedInUser = user && localStorage.getItem("token");
  const showLoginLink = !isLoggedInUser && !isAuthPage;
  const showUserLinks = isLoggedInUser;

  return (
    <div className="Header">
      {isLoggedInUser && (
        <div className="GeneralNavigation nav-group">
          <NavLink to="/recipes-screen" className="RecipesScreenLink">
            <div className="Home">
              <HomeOutlined />
              <p>Home</p>
            </div>
          </NavLink>

          <NavLink to="/generate-screen" className="GenerateScreenLink">
            <div className="Generate">
              <LibraryAdd />
              <p>Generate</p>
            </div>
          </NavLink>
        </div>
      )}

      <div className="UserNavigation nav-group">
        <NavLink to="/about-screen" className="AboutScreenLink">
          <div className="About">
            <Info />
            <p>About</p>
          </div>
        </NavLink>

        {showLoginLink && (
          <NavLink to="/login-screen" className="LoginScreenLink">
            <div className="Login">
              <LoginIcon />
              <p>Login</p>
            </div>
          </NavLink>
        )}

        {showUserLinks && (
          <>
            <NavLink to="/profile-screen" className="ProfileScreenLink">
              <div className="Profile">
                <PersonOutlineOutlinedIcon />
                <p>Profile</p>
              </div>
            </NavLink>

            <NavLink
              to="/login-screen"
              className="LogoutLink"
              onClick={logout}
            >
              <div className="Logout">
                <LogoutIcon />
                <p>Logout</p>
              </div>
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}
