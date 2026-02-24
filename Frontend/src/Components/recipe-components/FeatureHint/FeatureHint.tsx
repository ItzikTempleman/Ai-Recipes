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

export function FeatureHint() {
  const user = useSelector((state: AppState) => state.user);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isHebrew = (i18n.language ?? "").startsWith("he");
  const dir: "rtl" | "ltr" = isHebrew ? "rtl" : "ltr";

  return (
    <div className={`FeatureHint ${user ? "user" : "guest"}`}>
      {!user && (
        <div className="FeatureUnlockHint" dir={dir}>
          <div className="FeatureUnlockHint__bubble">
            <div className="FeatureUnlockHint__list">
              <div className="FeatureUnlockHint__line FeatureUnlockHint__line--ask">
                <span className="FeatureUnlockHint__icon" aria-hidden="true">
                  <BubbleChartIcon />
                </span>
                <span className="FeatureUnlockHint__label">
                  {t("homeScreen.ask")}
                </span>
              </div>

              <div className="RadioBtn">•</div>

              <div className="FeatureUnlockHint__line FeatureUnlockHint__line--save">
                <span className="FeatureUnlockHint__icon" aria-hidden="true">
                  <FavoriteIcon />
                </span>
                <span className="FeatureUnlockHint__label">
                  {t("homeScreen.save")}
                </span>
              </div>

              <div className="RadioBtn">•</div>

              <div className="FeatureUnlockHint__line FeatureUnlockHint__line--history">
                <span className="FeatureUnlockHint__icon" aria-hidden="true">
                  <HistoryIcon />
                </span>
                <span className="FeatureUnlockHint__label">
                  {t("homeScreen.history")}
                </span>
              </div>
            </div>

            <div
              className="FeatureUnlockHint__ctaPill"
              onClick={() => navigate("/login")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/login");
              }}
              aria-label={t("homeScreen.freeWithLogin")}
            >
              <span className="FeatureUnlockHint__ctaText">
                {t("homeScreen.freeWithLogin")}
              </span>

              <span className="FeatureUnlockHint__arrow" aria-hidden="true">
                {isHebrew ? <ArrowBackIosIcon /> : <ArrowForwardIosIcon />}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}