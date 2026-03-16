import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LoginIcon from '@mui/icons-material/Login';
import type { AppState } from "../../../Redux/Store";
import { userService } from "../../../Services/UserService";
import { notify } from "../../../Utils/Notify";
import { DeleteDialog } from "../DeleteDialog/DeleteDialog";
import LogoutIcon from '@mui/icons-material/Logout';
import "./DrawerLayout.css";

type DrawerState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type Language = "en" | "he";

export enum DrawerItemKey {
  Profile = "profile",
  Admin = "admin",
  About = "about",
  Login = "login",
  Logout = "logout",
}

export type DrawerItem = {
  key: DrawerItemKey;
  label: string;
  icon: ReactNode;
  visible: boolean;
  className: string;
  to?: string;
  onClick?: () => void;
};

export function DrawerLayout({ open, setOpen }: DrawerState) {
const { t, i18n } = useTranslation();
const isRTL = i18n.dir() === "rtl";
  const navigate = useNavigate();

  const user = useSelector((state: AppState) => state.user);

  const isLoggedIn = !!localStorage.getItem("token");
  const isAdmin = isLoggedIn && user?.roleId === 1;

  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<number | null>(null);

  const moreActionsRef = useRef<HTMLDivElement | null>(null);

  function closeDrawer(): void {
    setOpen(false);
  }

  function handleNavigate(path: string): void {
    navigate(path);
    closeDrawer();
  }

  function handleLogout(): void {
    setIsOpen(false);
    closeDrawer();
    userService.logout();
    navigate("/home");
  }

  function askDeleteAccount(userId: number): void {
    setPendingDeleteUserId(userId);
    setConfirmOpen(true);
  }

  function cancelDeleteAccount(): void {
    setConfirmOpen(false);
    setPendingDeleteUserId(null);
  }

  async function confirmDeleteAccount(): Promise<void> {
    if (pendingDeleteUserId == null) return;

    try {
      await userService.deleteAccount(pendingDeleteUserId);
      notify.success(t("drawer.confirmation"));
      setConfirmOpen(false);
      setPendingDeleteUserId(null);
      navigate("/login");
      closeDrawer();
    } catch (err: any) {
      notify.error(err);
    }
  }

  const drawerItems: DrawerItem[] = [
    {
      key: DrawerItemKey.Profile,
      label: t("drawer.profile"),
      icon: <PersonIcon />,
      visible: isLoggedIn,
      to: "/profile",
      className: "ProfileBtn",
    },
    {
      key: DrawerItemKey.Admin,
      label: t("drawer.admin"),
      icon: <AdminPanelSettingsIcon />,
      visible: isAdmin,
      to: "/admin",
      className: "AdminBtn",
    },
    {
      key: DrawerItemKey.About,
      label: t("nav.about"),
      icon: <InfoOutlinedIcon />,
      visible: true,
      to: "/about",
      className: "AboutScreenBtn",
    },
    {
      key: DrawerItemKey.Login,
      label: t("auth.login.title"),
      icon: <LoginIcon />,
      visible: !isLoggedIn,
      onClick: () => handleNavigate("/login"),
      className: "LoginFromDrawerBtn",
    },
    {
      key: DrawerItemKey.Logout,
      label: t("drawer.logout"),
      icon: <LogoutIcon />,
      visible: isLoggedIn,
      onClick: handleLogout,
      className: "LogoutFromDrawerBtn",
    },
  ];

  const navigationItems = drawerItems.filter(
    (item) => item.visible && item.to
  );

  const actionItems = drawerItems.filter(
    (item) => item.visible && item.onClick
  );

  return (
    <div>
      <IconButton onClick={() => setOpen(true)}>
        <MenuIcon fontSize="large" />
      </IconButton>

      <Drawer
        open={open}
        onClose={closeDrawer}
        anchor="right"
        ModalProps={{ keepMounted: true }}
      >
        <aside className="DrawerMainContainer" dir={isRTL ? "rtl" : "ltr"}>
          <div className="CloseButton" onClick={closeDrawer}>
            <CloseIcon />
          </div>

          <div className={`DrawerContent ${isLoggedIn ? "LoggedIn" : "LoggedOut"}`}>
            {isLoggedIn ? (
              <div>
                <img
                  className="ProfileImage"
                  src={user?.imageUrl || "/person-21.png"}
                  alt="Profile"
                />

                <h2 className="UserName">
                  {user.firstName} {user.familyName}
                </h2>
              </div>
            ) : (
              <div>
                <img
                  className="NoProfileImage"
                  src="/person-21.png"
                  alt="Guest"
                />
              </div>
            )}

  {navigationItems.map((item) => (
  <div key={item.key}>
    <NavLink
      to={item.to!}
      className={item.className}
      onClickCapture={closeDrawer}
    >
      {item.icon}
      <p>{item.label}</p>
    </NavLink>
    <div className="border-bottom"></div>
  </div>
))}

{actionItems.map((item) => (
  <div key={item.key}>
     <div className="border-top"></div>
    <Button
      className={item.className}
      onClick={item.onClick}
    >
      {item.icon}
      <p>{item.label}</p>
    </Button>
    
    <div className="border-bottom"></div>
  </div>
))}

            {isLoggedIn && (
              <div className="MoreOptionsDropdown" ref={moreActionsRef}>
                <Button
                  className="MoreBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                  }}
                  startIcon={isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                >
                  {isOpen ? t("drawer.less") : t("drawer.more")}
                </Button>

                <div
                  className={`MoreOptionsSection ${isOpen ? "open" : "closed"}`}
                  onClick={() => askDeleteAccount(user.id)}
                >
                  <PersonOffIcon />
                  <h5>{t("drawer.deleteAccount")}</h5>
                </div>
              </div>
            )}
          </div>
        </aside>
      </Drawer>

      <DeleteDialog
        open={confirmOpen}
        onCancel={cancelDeleteAccount}
        onConfirm={confirmDeleteAccount}
      />
    </div>
  );
}