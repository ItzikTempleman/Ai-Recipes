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
import { useEffect, useState } from "react";

export function Header() {
  const user = useSelector((state: AppState) => state.user);
   const fallbackAvatar = "/person-21.png";
  const [imagePreview, setImagePreview] = useState<string | null>(
    fallbackAvatar
  );

  async function logout(): Promise<void> {
    notify.success(`Good bye ${user.firstName} ${user.familyName}`);
    userService.logout();
  }

  useEffect(() => {
    if (user?.imageUrl) {
      setImagePreview(user.imageUrl);
    } else {
      setImagePreview(fallbackAvatar);
    }
  }, [user, fallbackAvatar]);
    
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
          <NavLink to="/home-screen" className="HomeScreenLink">
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
            <NavLink to="/profile-screen">
  
                   <img
          className="HeaderImagePreview"
          src={imagePreview || fallbackAvatar}
    
        />
  
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
