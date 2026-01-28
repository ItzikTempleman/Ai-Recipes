import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import LanguageIcon from "@mui/icons-material/Language";

import { useSelector } from "react-redux";

import UndoIcon from "@mui/icons-material/Undo";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch } from "react-redux";
import { Language, useLanguage } from "../../Utils/SetLanguage";
import { AppState } from "../../Redux/Store";
import { resetGenerated, restoreGuestRecipe, stashGuestRecipe } from "../../Redux/RecipeSlice";
import { userService } from "../../Services/UserService";
import { DrawerLayout } from "../user-components/DrawerLayout/DrawerLayout";


export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const { initialLanguage, setLang, isRtl } = useLanguage();
  const user = useSelector((state: AppState) => state.user);
  const currentRecipe = useSelector((state: AppState) => state.recipes.current);
  const guestStash = useSelector((state: AppState) => state.recipes.guestStash);
  const isGuest = !user;
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOnRecipeInputScreen =location.pathname === "/generate" || location.pathname.startsWith("/generate/");
  const hasCurrentRecipe = Boolean(currentRecipe?.title);
  const hasStashRecipe = Boolean(guestStash?.title);
  const showUndo = isGuest && (hasCurrentRecipe || hasStashRecipe) && !isOnRecipeInputScreen;
  const returnImage = hasCurrentRecipe ? (currentRecipe?.imageUrl ?? ""): (guestStash?.imageUrl ?? "");

  const handleGenerateClick = () => {
    if (isGuest && hasCurrentRecipe) {
      dispatch(stashGuestRecipe(currentRecipe!));
    }
    dispatch(resetGenerated()); 
  };

  const handleReturnClick = () => {
    if (isGuest && !hasCurrentRecipe) {
      dispatch(restoreGuestRecipe());
    }
  };

  return (
    <div className={`Header ${isRtl ? "rtl" : ""}`}>
      <div className="GeneralNavigation">
        <NavLink
          to="/home"
          className={({ isActive }) => `HomeScreenBtn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              {isActive ? <HomeIcon /> : <HomeOutlinedIcon />}
              <p>{t("nav.home")}</p>
            </>
          )}
        </NavLink>

        {user && (
          <NavLink
            to="/likes"
            className={({ isActive }) => `LikesScreenBtn ${isActive ? "active" : ""}`}
          >
            {({ isActive }) => (
              <>
                {isActive ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                <p>{t("nav.likes")}</p>
              </>
            )}
          </NavLink>
        )}

        <NavLink
          to="/generate"
          onClick={handleGenerateClick}
          className={({ isActive }) => `NewScreenBtn ${isActive ? "active" : ""}`}
        >
          <AddIcon />
          <p>{t("nav.generate")}</p>
        </NavLink>

        {showUndo && (
<div className={`ReturnToRecipeSection ${returnImage ? "hasImage" : ""}`}>
  <NavLink to="/generate" onClick={handleReturnClick}>
    {returnImage ? (
      <img className="ReturnToRecipeImage" src={returnImage} />
    ) : (
      <UndoIcon className={`ReturnToRecipeSvg ${isRtl ? "rtl" : "ltr"}`} />
    )}
  </NavLink>
</div>
        )}
      </div>

      <div className="HeaderRight">


        <div className="LanguageLink">
          <LanguageIcon />
          <select
            className="LanguageSelector"
            value={initialLanguage}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            <option value="en">{t("drawer.english")}</option>
            <option value="he">{t("drawer.hebrew")}</option>
          </select>
        </div>

        <div className={`IdentityBadge ${user ? "user" : "guest"}`}>
          {isGuest ? (
            <div className="GuestBadgeRow">
  <div className="Guest">{t("homeScreen.guest")}</div>
  <div className="HeaderDiv" />
</div>
          ) : (
            <div className="User" onClick={() => {
              navigate("/profile");
            }}>
              {user.firstName} <span className="FamilyName">{user.familyName}</span>
            </div>
          )}
        </div>

        {!isGuest ? (
          <div
            className="LogoutBtn"
            onClick={() => {
              navigate("/home");
              userService.logout();
            }}
          >
            <h3>{t("drawer.logout")}</h3>
          </div>
        ) : (
          <div className="LoginBtn" onClick={() => navigate("/login")}>
            <h3>{t("drawer.login")}</h3>
          </div>
        )}

        <div className="MenuBtn">
          <DrawerLayout open={drawerOpen} setOpen={setDrawerOpen} />
        </div>
      </div>

    </div>
  );
}
