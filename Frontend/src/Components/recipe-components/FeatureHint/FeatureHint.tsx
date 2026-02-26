import { useSelector } from "react-redux";
import "./FeatureHint.css";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import HistoryIcon from "@mui/icons-material/History";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { AppState } from "../../../Redux/Store";
import { Button } from "@mui/material";

export function FeatureHint() {
  const user = useSelector((state: AppState) => state.user);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isHebrew = (i18n.language ?? "").startsWith("he");
  const dir: "rtl" | "ltr" = isHebrew ? "rtl" : "ltr";

  return (
    <div className={` ${user ? "user" : "guest"}  `}>
      {!user && (

        <div className="FeatureHint" dir={dir}>
       
<div className="ChatSection FeatureRow">
  <span className="FeaterIcon">
    <BubbleChartIcon />
  </span>
  <span className="FeatureLabel">{t("homeScreen.ask")}</span>
</div>

<div className="FavoritesSection FeatureRow">
  <span className="FeaterIcon">
    <FavoriteIcon />
  </span>
  <span className="FeatureLabel">{t("homeScreen.save")}</span>
</div>

<div className="HistorySection FeatureRow">
  <span className="FeaterIcon">
    <HistoryIcon />
  </span>
  <span className="FeatureLabel">{t("homeScreen.history")}</span>
</div>

<Button
  className="FreeWithLoginBtn"
  onClick={() => navigate("/login")}
>
  {t("homeScreen.freeWithLogin")}{" "}
  {isHebrew ? <ArrowBackIosIcon /> : <ArrowForwardIosIcon />}
</Button>
          
        </div>
      )}
    </div>
  );
}