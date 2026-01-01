import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Person from "@mui/icons-material/Person";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AppState } from "../../Redux/Store";

import "./DrawerLayout.css";
import { useTranslation } from "react-i18next";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { Button } from "@mui/material";

type DrawerState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type Language = "en" | "he";

export function DrawerLayout({ open, setOpen }: DrawerState) {
  const { t } = useTranslation();
  const user = useSelector((state: AppState) => state.user);
  const isLoggedIn = !!(user && localStorage.getItem("token"));
  const navigate = useNavigate();

  return (
    <div>
      <IconButton onClick={() => setOpen(true)}>
        <MenuIcon fontSize="large" />
      </IconButton>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        anchor="right"
        ModalProps={{ keepMounted: true }}>
        <aside className="DrawerMainContainer">
          <div className="CloseButton" onClick={() => setOpen(false)}>
            ❌
          </div>
          <div className={`DrawerContent ${isLoggedIn ? "" : "LoggedOut"}`}>
            {isLoggedIn ? (
              <div>
                <img className="ProfileImage" src={user?.imageUrl || "/person-21.png"}/>
                <h2 className="UserName">{user.firstName} {user.familyName}</h2>
                <Button
                  className="ProfileBtn"
                  variant="contained"
                  onClick={() => {
                    navigate("/profile");
                    setOpen(false);
                  }}>
                  <div className="ProfileRowInBtn">
                    <Person />
                    <p>{t("drawer.profile")}</p>
                  </div>
                </Button>
              </div>
            ) : (
              <div>
  
              </div>
            )}
   
      <NavLink to="/about" className="AboutScreenBtn">
          <InfoOutlinedIcon />
          <p>{t("nav.about")}</p>
        </NavLink>
            
          </div>
        </aside>
      </Drawer>
    </div>
  );
}
