import { NavLink } from "react-router-dom";
import "./Header.css";
import LibraryAdd from "@mui/icons-material/LibraryAdd";
import { useState } from "react";
import { Home } from "@mui/icons-material";
import { DrawerLayout } from "../DrawerLayout/DrawerLayout";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="Header">

      <div className="GeneralNavigation">
        <NavLink to="/home" className="HomeScreenLink">
          <div className="Home">
            <Home />
            <p>Home</p>
          </div>
        </NavLink>
        <NavLink to="/generate" className="GenerateScreenLink">
          <div className="Generate">
            <LibraryAdd />
            <p>Generate</p>
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
