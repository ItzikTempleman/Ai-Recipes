import { NavLink } from "react-router-dom";
import "./Header.css";
import LibraryAdd from "@mui/icons-material/LibraryAdd";
import { useState } from "react";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { DrawerLayout, Language } from "../DrawerLayout/DrawerLayout";
import { useTranslation } from "react-i18next";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from "../../Utils/SetLanguage";


export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();

  const { initialLanguage, setLang, isRtl } = useLanguage();

  return (
    <div className={`Header ${isRtl ? "rtl" : ""}`}>
      <div className="GeneralNavigation">
        <NavLink to="/home" className="HomeScreenLink">
          <div className="Home">
            <HomeOutlinedIcon />
            <p>{t("nav.home")}</p>
          </div>
        </NavLink>

        <NavLink to="/generate" className="GenerateScreenLink">
          <div className="Generate">
            <LibraryAdd />
            <p>{t("nav.generate")}</p>
          </div>
        </NavLink>

        <NavLink to="/about" className="AboutScreenLink">
          <div className="About">
            <InfoOutlinedIcon />
            <p>{t("nav.about")}</p>
          </div>
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
        <div className="Menu">
          <DrawerLayout open={drawerOpen} setOpen={setDrawerOpen} />
        </div>
      </div>
    </div>
  )
}