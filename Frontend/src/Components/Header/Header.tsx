import { NavLink } from "react-router-dom";
import "./Header.css";
import LibraryAdd from "@mui/icons-material/LibraryAdd";
import { useEffect, useState } from "react";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { DrawerLayout } from "../DrawerLayout/DrawerLayout";
import { useTranslation } from "react-i18next";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, i18n } = useTranslation();


 const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
 const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

  useEffect(() => {
   const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);

  return (
    <div className={`Header ${isRTL ? "rtl" : ""}`}>
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
      </div>

      <div className="Menu">
        <DrawerLayout open={drawerOpen} setOpen={setDrawerOpen} />
      </div>
    </div>
  );
}
