import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Person from "@mui/icons-material/Person";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AppState } from "../../../Redux/Store";
import "./DrawerLayout.css";
import { useTranslation } from "react-i18next";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRef, useState } from "react";
import { Button } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { userService } from "../../../Services/UserService";
import { notify } from "../../../Utils/Notify";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";

type DrawerState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type Language = "en" | "he";

export function DrawerLayout({ open, setOpen }: DrawerState) {
  const { t } = useTranslation();
  const user = useSelector((state: AppState) => state.user);
  const isLoggedIn = !!(user && localStorage.getItem("token"));
  const [isOpen, setIsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate()

const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteUserId, setPendingDeleteUserId] = useState<number | null>(null);

function askDeleteAccount(userId: number) {
  setPendingDeleteUserId(userId);
  setConfirmOpen(true);
}

function cancelDeleteAccount() {
  setConfirmOpen(false);
  setPendingDeleteUserId(null);
}

async function confirmDeleteAccount() {
  if (pendingDeleteUserId == null) return;

  try {
    await userService.deleteAccount(pendingDeleteUserId);
    notify.success(t("drawer.confirmation"));
    setConfirmOpen(false);
    setPendingDeleteUserId(null);
    navigate("/login");
  } catch (err: any) {
    notify.error(err);
  }
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
          <div className="CloseButton" onClick={() => setOpen(false)}>
            ❌
          </div>
          <div className={`DrawerContent ${isLoggedIn ? "LoggedIn" : "LoggedOut"}`}>

            {isLoggedIn ? (
              <div>
                <img className="ProfileImage" src={user?.imageUrl || "/person-21.png"} />
                <h2 className="UserName">{user.firstName} {user.familyName}</h2>

                <NavLink onClickCapture={() => setOpen(false)}
                  to="/profile" className="ProfileBtn"

                >
                  <Person />
                  <p>{t("drawer.profile")}</p>

                </NavLink>
              </div>
            ) : null}
            <NavLink onClickCapture={() => setOpen(false)} to="/about" className="AboutScreenBtn" >

              <InfoOutlinedIcon />
              <p>{t("nav.about")}</p>
            </NavLink>

            {isLoggedIn ? (
              <div className="MoreOptionsDropdown" ref={moreActionsRef}>
                <Button
                  className="MoreBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((v) => !v);
                  }}

                  startIcon={isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                >
                  {t("drawer.more")}
                </Button>
                <div className={`MoreOptionsSection ${isOpen ? "open" : "closed"}`} onClick={() => {
                  askDeleteAccount(user.id)
                }}>
                  <PersonOffIcon />
                  <h5> {t("drawer.deleteAccount")}</h5>

                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </Drawer>
      <ConfirmDialog
  open={confirmOpen}
  message={t("drawer.areYouSure")}
  onCancel={cancelDeleteAccount}
  onConfirm={confirmDeleteAccount}
/>
    </div>
  );
}
