import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Info from "@mui/icons-material/Info";
import Person from "@mui/icons-material/Person";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AppState } from "../../Redux/Store";
import { userService } from "../../Services/UserService";
import "./DrawerLayout.css";
import { useEffect, useState } from "react";
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from "react-i18next";
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

type DrawerState = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export type Language = "en" | "he";
export function DrawerLayout({ open, setOpen }: DrawerState) {
const { t, i18n } = useTranslation();

const [isRTL, setIsRTL] = useState(() => i18n.language?.startsWith("he"));

  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(lng?.startsWith("he"));
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, [i18n]);

  const flipSx = { transform: isRTL ? "scaleX(-1)" : "none" };
  const LoginIc = isRTL ? LogoutIcon : LoginIcon;
  const LogoutIc = isRTL ? LoginIcon : LogoutIcon;

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

                    <div className={`DrawerContent ${isLoggedIn ? "" : "DrawerLoggedOut"} ${isRTL ? "rtl" : ""}`}>

                        {isLoggedIn ? (
                            <div>
                                <img className="ProfileImage" src={user?.imageUrl || "/person-21.png"} />
                                <h2 className="UserName">{user.firstName} {user.familyName} </h2>
                                <div className="Divider"></div>
                                <NavLink to="/profile" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="ProfileRow">
                                        <Person />
                                        <h4>{t("drawer.profile")}</h4>
                                    </div>
                                </NavLink>
                            </div>
                        ) : (
                            <div>
                                <h3 className="UserName">{t("drawer.helloGuest")}</h3>
                                <NavLink className="DrawerNavLink" to="/login" onClick={() => setOpen(false)}>
                                    <div className="LoginRow">
                                          <LoginIc sx={flipSx} />
                                        <p>{t("drawer.login")}</p>
                                    </div>
                                </NavLink>
                                     <div className="Divider"></div>
                            </div>
                        )}

                        <NavLink to="/about" className="DrawerNavLink" onClick={() => setOpen(false)}>
                            <div className="AboutRow">
                                <Info />
                                <h4>{t("drawer.about")}</h4>
                            </div>
                        </NavLink>
                        <div className="Divider"></div>
                        <div className="LanguageRow">
                            <div className="SelectLanguage">
                                <LanguageIcon />
                             
                            </div>

                            <div>
                                <label>{t("drawer.english")}</label>
                                <input
                                    type="radio"
                                    checked={language === "en"}
                                    onChange={() => handleLanguageSelect("en")}
                                />
                                <div></div>
                                <label>{t("drawer.hebrew")}</label>
                                <input
                                    type="radio"
                                    checked={language === "he"}
                                    onChange={() => handleLanguageSelect("he")}
                                />
                            </div>
                        </div>

                        {isLoggedIn ? (
                            <NavLink
                                to="/home"
                                className="DrawerNavLink DrawerLogoutLink"
                                onClick={() => {
                                    userService.logout();
                                    setOpen(false);
                                }}>
                                <div className="LogoutRow">
                                    <LogoutIc sx={flipSx} />
                                    <p>{t("drawer.logout")}</p>
                                </div>
                            </NavLink>
                        ) : null}
                    </div>
                </aside>
            </Drawer>
        </div>
    )
}
