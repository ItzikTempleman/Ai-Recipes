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
import { changeLanguage, toggleDarkMode } from "../../Utils/Utils";
import { Language, SettingsBrightness } from "@mui/icons-material";

type DrawerState = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export enum LANGUAGE {
    ENGLISH = "ENGLISH",
    HEBREW = "HEBREW",
}

export type SettingSelection = {
    selectedLanguage: LANGUAGE;
    isDarkMode: boolean;
};

export function DrawerLayout({ open, setOpen }: DrawerState) {
    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = !!(user && localStorage.getItem("token"));

    const [settingSelection, setSettingSelection] = useState<SettingSelection>(() => {
        const storedLanguage = (localStorage.getItem("selectedLanguage") as LANGUAGE | null) ?? LANGUAGE.ENGLISH;
        const storedDarkMode = localStorage.getItem("isDarkMode");
        return {
            selectedLanguage: storedLanguage,
            isDarkMode: storedDarkMode ? storedDarkMode === "true" : false,
        };
    });

    function handleLanguageSelect(language: LANGUAGE) {
        setSettingSelection((previousSelection) => ({ ...previousSelection, selectedLanguage: language }));
        localStorage.setItem("selectedLanguage", language);
        changeLanguage(language);
    }

    function handleDarkModeSelect(isDarkMode: boolean) {
        setSettingSelection((previousSelection) => ({ ...previousSelection, isDarkMode }));
        localStorage.setItem("isDarkMode", String(isDarkMode));
        toggleDarkMode(isDarkMode);
    }

    return (
        <div className="DrawerLayout">
            <IconButton onClick={() => setOpen(true)}>
                <MenuIcon />
            </IconButton>

            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                anchor="right"
                ModalProps={{ keepMounted: true }}
            >
                <aside className="DrawerMainContainer">
                    <div className="DrawerCloseButton" onClick={() => setOpen(false)}>
                        ❌
                    </div>

                    <div className="DrawerContent">
                        {isLoggedIn ? (
                            <div>
                                <img className="ProfileImage" src={user?.imageUrl || "/person-21.png"} />
                                <h3 className="UserName">{user.firstName}</h3>
                                <NavLink to="/profile-screen" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="ProfileRow">
                                        <Person />
                                        <p>Profile</p>
                                    </div>
                                </NavLink>
                                <NavLink to="/about-screen" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="AboutRow">
                                        <Info />
                                        <p>About</p>
                                    </div>
                                </NavLink>
                                <div className="LanguageRow">
                                    <div className="RowLeft">
                                        <Language />
                                        <p>Select language</p>
                                    </div>
                                    <div className="RowRight">
                                        <label className="RadioOption">
                                            <input
                                                type="radio"
                                                checked={settingSelection.selectedLanguage === LANGUAGE.ENGLISH}
                                                onChange={() => handleLanguageSelect(LANGUAGE.ENGLISH)}/>
                                            <span>English</span>
                                        </label>
                                        <label className="RadioOption">
                                            <input
                                                type="radio"
                                                checked={settingSelection.selectedLanguage === LANGUAGE.HEBREW}
                                                onChange={() => handleLanguageSelect(LANGUAGE.HEBREW)}/>
                                            <span>Hebrew</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="DarkModeRow">
                                    <div className="RowLeft">
                                        <SettingsBrightness />
                                        <p>Dark mode</p>
                                    </div>
                                    <div className="RowRight">
                                        <label className="RadioOption">
                                            <input
                                                type="radio"
                                                checked={settingSelection.isDarkMode === true}
                                                onChange={() => handleDarkModeSelect(true)}/>
                                            <span>On</span>
                                        </label>
                                        <label className="RadioOption">
                                            <input
                                                type="radio"
                                                checked={settingSelection.isDarkMode === false}
                                                onChange={() => handleDarkModeSelect(false)}/>
                                            <span>Off</span>
                                        </label>
                                    </div>
                                </div>
                                <NavLink
                                    to="/home-screen"
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
                                <NavLink className="DrawerNavLink" to="/login-screen" onClick={() => setOpen(false)}>

                                    <div className="LoginRow">
                                        <LoginIcon />
                                        <p>Log in</p>
                                    </div>
                                </NavLink>
                                <NavLink to="/about-screen" className="DrawerNavLink" onClick={() => setOpen(false)}>
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
    );
}