import { NavLink } from "react-router-dom";
import "./Header.css";
import LibraryAdd from "@mui/icons-material/LibraryAdd";
import { useState } from "react";
import { Home } from "@mui/icons-material";
import { DrawerLayout } from "../DrawerLayout/DrawerLayout";
import { useTranslation } from "react-i18next";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
    const { t } = useTranslation();
  return (
    <div className="Header">

      <div className="GeneralNavigation">
        <NavLink to="/home" className="HomeScreenLink">
          <div className="Home">
            <Home />
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
        <DrawerLayout 
          open={drawerOpen}
          setOpen={setDrawerOpen}
        />
      </div>
    </div>
  );
}
