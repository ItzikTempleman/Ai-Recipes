import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useState } from "react";
import { DrawerLayout, Language } from "../DrawerLayout/DrawerLayout";
import { useTranslation } from "react-i18next";
import LanguageIcon from "@mui/icons-material/Language";
import { useLanguage } from "../../Utils/SetLanguage";
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import UndoIcon from "@mui/icons-material/Undo";
import { userService } from "../../Services/UserService";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const { initialLanguage, setLang, isRtl } = useLanguage();
  const user = useSelector((state: AppState) => state.user);
  const currentRecipe = useSelector((state: AppState) => state.recipes.current);
  const isGuest = !user;
  const location = useLocation();
  const isOnRecipeInputScreen =
    location.pathname === "/generate" || location.pathname.startsWith("/generate/");
  const hasGeneratedRecipe = Boolean(currentRecipe?.title);
  const showUndo = isGuest && hasGeneratedRecipe && !isOnRecipeInputScreen;
  const navigate = useNavigate();

  return (
    <div className={`Header ${isRtl ? "rtl" : ""}`}>
      <div className="GeneralNavigation">
        <NavLink
          to="/home"
          className={({ isActive }) => `HomeScreenBtn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              {isActive ? <HomeIcon /> : <HomeOutlinedIcon />}
              <p>{t("nav.home")}</p>
            </>
          )}
        </NavLink>

        {showUndo && (
          <NavLink to="/generate" className="ReturnScreenBtn">
            <UndoIcon className={`ReturnSvg ${isRtl ? "rtl" : ""}`} />
            <p>{t("nav.return")}</p>
          </NavLink>
        )}

        {user && (
          <NavLink
            to="/likes"
            className={({ isActive }) => `LikesScreenBtn ${isActive ? "active" : ""}`}
          >
            {({ isActive }) => (
              <>
                {isActive ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                <p>{t("nav.likes")}</p>
              </>
            )}
          </NavLink>
        )}
      </div>

      <div className="HeaderRight">


        <div className="LanguageLink">
          <LanguageIcon />
          <select
            className="LanguageSelector"
            value={initialLanguage}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            <option value="en">{t("drawer.english")}</option>
            <option value="he">{t("drawer.hebrew")}</option>
          </select>
        </div>

        {!isGuest ? (
          <div
            className="LogoutBtn"
            onClick={() => {
              navigate("/home");
              userService.logout();
            }}
          >
           <h3>{t("drawer.logout")}</h3> 
          </div>
        ) : (
          <div
            className="LoginBtn"
            onClick={() => navigate("/login")}
          >
            <h3>{t("drawer.login")}</h3>
          </div>
        )}
        <div className="MenuBtn">
          <DrawerLayout open={drawerOpen} setOpen={setDrawerOpen} />
        </div>
      </div>
    </div>
  );
}
