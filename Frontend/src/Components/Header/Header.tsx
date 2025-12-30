import { NavLink } from "react-router-dom";
import "./Header.css";
import { useState } from "react";
import HomeIcon from '@mui/icons-material/Home';
import { DrawerLayout, Language } from "../DrawerLayout/DrawerLayout";
import { useTranslation } from "react-i18next";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from "../../Utils/SetLanguage";

import FavoriteIcon from '@mui/icons-material/Favorite';
import { useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const { initialLanguage, setLang, isRtl } = useLanguage();
  const user = useSelector((state: AppState) => state.user);
  return (
    <div className={`Header ${isRtl ? "rtl" : ""}`}>
      <div className="GeneralNavigation">
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
        <NavLink to="/about" className="AboutScreenBtn">
            <InfoOutlinedIcon />
            <p>{t("nav.about")}</p>
        </NavLink>
      </div>

      <div className="HeaderRight">
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