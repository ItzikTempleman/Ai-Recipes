import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { Button, Dialog } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppState } from "../../../Redux/Store";
import { userService } from "../../../Services/UserService";
import { notify } from "../../../Utils/Notify";
import { DeleteDialog } from "../DeleteDialog/DeleteDialog";
import premiumBadge from "../../../Assets/images/premium.jpg";

import "./DrawerLayout.css";
import { PremiumDialog } from "../PremiumDialog/PremiumDialog";

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

  const isLoggedIn = !!user;
  const isAdmin = isLoggedIn && user?.roleId === 1;

  const isPremium = user?.isPremium === true;
  const showUpgradeToPremium = !isPremium && !isAdmin && isLoggedIn;

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPremiumOpen, setConfirmPremiumOpen] = useState(false);
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
    setIsMoreOpen(false);
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

  function openPremiumDialog(): void {
    setConfirmPremiumOpen(true);
  }

  function closePremiumDialog(): void {
    setConfirmPremiumOpen(false);
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
      className: "DrawerItem ProfileBtn",
    },
    {
      key: DrawerItemKey.Admin,
      label: t("drawer.admin"),
      icon: <AdminPanelSettingsIcon />,
      visible: isAdmin,
      to: "/admin",
      className: "DrawerItem AdminBtn",
    },
    {
      key: DrawerItemKey.About,
      label: t("nav.about"),
      icon: <InfoOutlinedIcon />,
      visible: true,
      to: "/about",
      className: "DrawerItem AboutScreenBtn",
    },
    {
      key: DrawerItemKey.Login,
      label: t("auth.login.title"),
      icon: <LoginIcon />,
      visible: !isLoggedIn,
      onClick: () => handleNavigate("/login"),
      className: "DrawerItem LoginFromDrawerBtn",
    },
    {
      key: DrawerItemKey.Logout,
      label: t("drawer.logout"),
      icon: <LogoutIcon />,
      visible: isLoggedIn,
      onClick: handleLogout,
      className: "DrawerItem LogoutFromDrawerBtn",
    },
  ];

  const navigationItems = drawerItems.filter((item) => item.visible && item.to);
  const actionItems = drawerItems.filter((item) => item.visible && item.onClick);

  return (
    <div>
      <IconButton className="menu-icon" onClick={() => setOpen(true)}>
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
              <div className="DrawerHeader">
                <img
                  className="ProfileImage"
                  src={user?.imageUrl || "/person-21.png"}
                  alt="Profile"
                />
                <h2 className="UserName">
                  {user?.firstName} {user?.familyName}
                </h2>
              </div>
            ) : (
              <div className="DrawerHeader">
                <img className="NoProfileImage" src="/person-21.png" alt="Guest" />
              </div>
            )}
            {!user && (

              <div className={`HelloGuestMessage`}>
                <p>{t("generate.guest")}</p>

              </div>
            )}
            {
              isAdmin && (
                <div className="AdminBadge">
                  <p>{t("drawer.role")}</p>
                </div>
              )
            }
            {isPremium && (
              <div className="PremiumBadgeContainer">
                <div className="PremiumImageWrapper">
                  <img className="premium-image" src={premiumBadge} alt="Premium" />
                  <div className="PremiumBadge">
                    <p>{t("drawer.premium")}</p>
                  </div>
                </div>
              </div>
            )}
            {
              showUpgradeToPremium && (
                <Button className="UpgradeBtn" variant="contained" onClick={() => { openPremiumDialog() }}>
                  {t("drawer.upgrade")}
                </Button>
              )
            }

            {navigationItems.map((item) => (
              <div key={item.key} className="DrawerRow">
                <NavLink
                  to={item.to!}
                  className={item.className}
                  onClick={closeDrawer}
                >
                  <span className="DrawerItemIcon">{item.icon}</span>
                  <span className="DrawerItemLabel">{item.label}</span>
                </NavLink>
                <div className="border-bottom" />
              </div>
            ))}

            {actionItems.map((item) => (
              <div key={item.key} className="DrawerRow">
                <Button className={item.className} onClick={item.onClick}>
                  <span className="DrawerItemIcon">{item.icon}</span>
                  <span className="DrawerItemLabel">{item.label}</span>
                </Button>
                <div className="border-bottom" />
              </div>
            ))}

            {isLoggedIn && (
              <div className="MoreOptionsDropdown" ref={moreActionsRef}>
                <Button
                  className="MoreBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreOpen((prev) => !prev);
                  }}
                  startIcon={isMoreOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                >
                  {isMoreOpen ? t("drawer.less") : t("drawer.more")}
                </Button>

                <div
                  className={`MoreOptionsSection ${isMoreOpen ? "open" : "closed"}`}
                  onClick={() => user?.id && askDeleteAccount(user.id)}
                >
                  <span className="DrawerItemIcon">
                    <PersonOffIcon />
                  </span>
                  <h5 className="DeleteAccountText">{t("drawer.deleteAccount")}</h5>
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

      <Dialog
  open={confirmPremiumOpen}
  onClose={closePremiumDialog}
  maxWidth={false}
  PaperProps={{ className: "premium_dialog_paper" }}
      >
        <PremiumDialog onClose={closePremiumDialog}/>
      </Dialog>
    </div>
  );
}