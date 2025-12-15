import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import Info from "@mui/icons-material/Info";
import Person from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AppState } from "../../Redux/Store";
import { userService } from "../../Services/UserService";
import "./DrawerLayout.css";
import { useState } from "react";
import i18n from "../../Utils/118n";
import LanguageIcon from '@mui/icons-material/Language';
type DrawerState = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export type Language = "en" | "he";


export function DrawerLayout({ open, setOpen }: DrawerState) {
    const user = useSelector((state: AppState) => state.user);

    const isLoggedIn = !!(user && localStorage.getItem("token"));

    const [language, setLanguage] = useState<Language>(
        () => {
            const storedLanguage = localStorage.getItem("selectedLanguage");
            return storedLanguage === "he" || storedLanguage === "en" ? storedLanguage : "en";
        }
    );

    function handleLanguageSelect(lang: Language) {
        setLanguage(lang);
        localStorage.setItem("selectedLanguage", lang);
        i18n.changeLanguage(lang);
    }

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
                    <div className="DrawerCloseButton" onClick={() => setOpen(false)}>
                        ❌
                    </div>

                    <div className="DrawerContent">
                        {isLoggedIn ? (
                            <div>
                                <img className="ProfileImage" src={user?.imageUrl || "/person-21.png"} />
                                <h2 className="UserName">{user.firstName} {user.familyName} </h2>
                                <div className="Divider"></div>
                                <NavLink to="/profile" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="ProfileRow">
                                        <Person />
                                        <h4>Profile</h4>
                                    </div>
                                </NavLink>
                                <NavLink to="/about" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="AboutRow">
                                        <Info />
                                        <h4>About</h4>
                                    </div>
                                </NavLink>
                                <div className="LanguageRow">
                                    <div className="SelectLanguage">
                                        <LanguageIcon/>
                                    <h4>Select language</h4>
                                    </div>
                         
                                    <div>
                                    <label>English</label>
                                    <input
                                        type="radio"
                                        checked={language === "en"}
                                        onChange={() => handleLanguageSelect("en")}
                                    />
                                     <div></div>
                                      <label>Hebrew</label>
                                    <input
                                        type="radio"
                                        checked={language === "he"}
                                        onChange={() => handleLanguageSelect("he")}
                                    />
                                    </div>
                                </div>

                                <NavLink
                                    to="/home"
                                    className="DrawerNavLink DrawerLogoutLink"
                                    onClick={() => {
                                        userService.logout();
                                        setOpen(false);
                                    }}>
                                    <div className="LogoutRow">
                                        <LogoutIcon />
                                        <p>Logout</p>
                                    </div>
                                </NavLink>
                            </div>
                        ) : (
                            <div>
                                <h3 className="UserName">Hello Guest</h3>
                                <NavLink className="DrawerNavLink" to="/login" onClick={() => setOpen(false)}>

                                    <div className="LoginRow">
                                        <LoginIcon />
                                        <p>Log in</p>
                                    </div>
                                </NavLink>
                                <NavLink to="/about" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="AboutRow">
                                        <Info />
                                        <p>About</p>
                                    </div>
                                </NavLink>
                            </div>
                        )}
                    </div>
                </aside>
            </Drawer>
        </div>
    )
}