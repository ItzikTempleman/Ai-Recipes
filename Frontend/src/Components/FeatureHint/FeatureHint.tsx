import { useSelector } from "react-redux";
import "./FeatureHint.css";
import { AppState } from "../../Redux/Store";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


export function FeatureHint() {
  const user = useSelector((state: AppState) => state.user);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isHebrew = (i18n.language ?? "").startsWith("he");
  const dir: "rtl" | "ltr" = "rtl";
 const alignClass = isHebrew ? "align-left" : "align-right";

  return (
    <div className={`FeatureHint ${user ? "user" : "guest"}`}>
      {!user && (
        <div className={`FeatureUnlockHint ${alignClass}`} dir={dir}>
          <div className="FeatureUnlockHint__bubble">
            <div className="FeatureUnlockHint__list">
              <div className="FeatureUnlockHint__line">
                <span className="FeatureUnlockHint__icon" aria-hidden>💬</span>
                <span className="FeatureUnlockHint__label">{t("homeScreen.ask")}</span>
              </div>

              <div className="FeatureUnlockHint__line">
                <span className="FeatureUnlockHint__icon" aria-hidden>❤️</span>
                <span className="FeatureUnlockHint__label">{t("homeScreen.save")}</span>
              </div>

              <div className="FeatureUnlockHint__line">
                <span className="FeatureUnlockHint__icon" aria-hidden>👀</span>
                <span className="FeatureUnlockHint__label">{t("homeScreen.remember")}</span>
              </div>
            </div>

            <div className="FeatureUnlockHint__ctaPill" onClick={() => navigate("/login")}>
              <span className="FeatureUnlockHint__lock" aria-hidden>🔒</span>
              {t("homeScreen.freeWithLogin")}
              <span className="FeatureUnlockHint__lock" aria-hidden>
                {isHebrew ? "⬅️" : "➡️"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}