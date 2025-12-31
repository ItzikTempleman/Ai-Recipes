import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useState } from "react";
import HomeIcon from '@mui/icons-material/Home';
import { DrawerLayout, Language } from "../DrawerLayout/DrawerLayout";
import { useTranslation } from "react-i18next";

import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from "../../Utils/SetLanguage";
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import UndoIcon from '@mui/icons-material/Undo';
import { Button } from "@mui/material";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const { initialLanguage, setLang, isRtl } = useLanguage();
  const user = useSelector((state: AppState) => state.user);
  const currentRecipe = useSelector((state: AppState) => state.recipes.current);
  const isGuest = !user;
  const location = useLocation();
  const isOnGenerateScreen = location.pathname === "/generate" || location.pathname.startsWith("/generate/");
  const hasGeneratedRecipe = Boolean(currentRecipe?.title);
  const showUndo = isGuest && hasGeneratedRecipe && !isOnGenerateScreen;
 const navigate = useNavigate();
 
  return (
    <div className={`Header ${isRtl ? "rtl" : ""}`}>
      <div className="GeneralNavigation">
        {showUndo && (
          <NavLink to="/generate" className="ReturnScreenBtn">
            <UndoIcon className= {`ReturnSvg ${isRtl ? "rtl" : ""}`}/>         
            <p>{t("nav.return")}</p>
          </NavLink>
        )}

        <NavLink to="/home" className="HomeScreenBtn">
          <HomeIcon />
          <p>{t("nav.home")}</p>
        </NavLink>
        {user && (
          <NavLink to="/likes" className="LikesScreenBtn">
            <FavoriteIcon />
            <p>{t("nav.likes")}</p>
          </NavLink>
        )}

      </div>

      <div className="HeaderRight">
        <Button className="LoginBtn"
        variant="contained"
onClick={
  () => navigate("/login")
}
        >
{t("drawer.login")}
        </Button>
        <div className="LanguageLink">
          <LanguageIcon />
          <select
            className="LanguageSelector"
            value={initialLanguage}
            onChange={(e) => setLang(e.target.value as Language)}>
            <option value="en">{t("drawer.english")}</option>
            <option value="he">{t("drawer.hebrew")}</option>
          </select>
        </div>
        <div className="MenuBtn">
          <DrawerLayout open={drawerOpen} setOpen={setDrawerOpen} />
        </div>
      </div>
    </div>
  )
}