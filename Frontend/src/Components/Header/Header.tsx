import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageIcon from "@mui/icons-material/Language";
import { useSelector, useDispatch } from "react-redux";
import UndoIcon from "@mui/icons-material/Undo";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import { Language, useLanguage } from "../../Utils/SetLanguage";
import { AppState } from "../../Redux/Store";
import { resetGenerated, restoreGuestRecipe, stashGuestRecipe } from "../../Redux/RecipeSlice";
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onHome = location.pathname === "/home" || location.pathname === "/";
  const isOnRecipeInputScreen =  location.pathname === "/generate" || location.pathname.startsWith("/generate/");
  const hasCurrentRecipe = Boolean(currentRecipe?.title);
  const hasStashRecipe = Boolean(guestStash?.title);
  const showUndo = isGuest && (hasCurrentRecipe || hasStashRecipe) && !isOnRecipeInputScreen;

  const returnImage = hasCurrentRecipe
    ? (currentRecipe?.imageUrl ?? "")
    : (guestStash?.imageUrl ?? "");

  const handleReturnClick = () => {

    if (isGuest && !hasCurrentRecipe && hasStashRecipe) {

      dispatch(restoreGuestRecipe());
    }
  };

const handleHomeClick = (e: React.MouseEvent) => {
  if (onHome && hasCurrentRecipe) {
    e.preventDefault();
    if (isGuest) {
      dispatch(stashGuestRecipe(currentRecipe!));
    }

    dispatch(resetGenerated());
    navigate("/home", { replace: true });
  }
};

  return (
    <div className={`Header ${isRtl ? "rtl" : ""}`}>
      <div className="GeneralNavigation">
        <NavLink
          to="/home"
          onClick={handleHomeClick}
          className={({ isActive }) => `HomeScreenBtn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <div>
              {isActive ? <HomeIcon /> : <HomeOutlinedIcon />}
              <p>{t("nav.home")}</p>
            </div>
          )}
        </NavLink>


        {showUndo && (
          <div className={`ReturnToRecipeSection ${returnImage ? "hasImage" : ""}`}>
            <NavLink to="/home" onClick={handleReturnClick}>
              {returnImage ? (
                <img className="ReturnToRecipeImage" src={returnImage} alt="recipe" />
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

        {!isGuest ? (
          <NavLink
            to="/profile"
            className={({ isActive }) => `IdentityBadge ${isActive ? "active" : ""}`}
          >
            {user.firstName} {user.familyName}
          </NavLink>
        ) : (<>
    
          <div className="LoginBtn" onClick={() => navigate("/login")}>
            <h3> {t("drawer.login")} </h3></div>
            </>
        )}

        <div className="MenuBtn">
          <DrawerLayout open={drawerOpen} setOpen={setDrawerOpen} />
        </div>
      </div>
    </div>
  );
}
