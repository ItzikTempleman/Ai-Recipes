import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import Info from "@mui/icons-material/Info";
import Settings from "@mui/icons-material/Settings";
import Person from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AppState } from "../../Redux/Store"; // adjust path
import { userService } from "../../Services/UserService";
import "./DrawerLayout.css";

type DrawerState = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export function DrawerLayout(
    { open, setOpen }: DrawerState
) {
    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = !!(user && localStorage.getItem("token"));

    return (
        <div className="DrawerLayout">
            <IconButton onClick={() => setOpen(true)}>
                <MenuIcon />
            </IconButton>
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                anchor="right"
                ModalProps={{ keepMounted: true }}>
                <aside className="DrawerMainContainer">
                    <div className="DrawerCloseButton" onClick={() => setOpen(false)}>❌</div>
                    <div className="DrawerContent">
                        {isLoggedIn ? (
                            <div>
                                <img className="ProfileImage" src={user?.imageUrl || "/person-21.png"}/>
                                <p >{isLoggedIn ? user.firstName : "Guest"}</p>
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
                                <NavLink to="/settings" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="SettingsRow">
                                        <Settings />
                                        <p>Settings</p>
                                    </div>
                                </NavLink>
                                <NavLink
                                    to="/login-screen"
                                    className="DrawerNavLink"
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
                                <NavLink to="/settings" className="DrawerNavLink" onClick={() => setOpen(false)}>
                                    <div className="SettingsRow">
                                        <Settings />
                                        <p>Settings</p>
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