import { useTranslation } from "react-i18next";
import "./PremiumDialog.css";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useState } from "react";
import Button from "@mui/material/Button";
import i18n from "../../../Utils/i18n";
import StarIcon from "@mui/icons-material/Star";

type CloseDialogProps = {
  onClose: () => void;
};

type SubscriptionType = "monthly" | "annual";

export function PremiumDialog({ onClose }: CloseDialogProps) {
  const { t } = useTranslation();
  const isRTL = (i18n.language ?? "").startsWith("he");
  const [selected, setSelected] = useState<SubscriptionType>("monthly");


  return (
    <div className="PremiumDialog">
      <div className="top-section">
        <div className="close-btn" onClick={onClose}>
          <CloseIcon />
        </div>

        <div className="premium-title-div">
          <AutoAwesome />
          <p className="subscription-title">{t("drawer.premium")}</p>
        </div>
      </div>

      <p className="subscription-sub-title">{t("premium.upgradeExperience")}</p>
      <div className="_divider"></div>

      <div className="second-title-section">
        <p>{t("premium.cookSmarter")}</p>
      </div>

      <div className="features-list">
        <div className="what_you_get yellow">
          <ElectricBoltIcon />
          <p>{t("premium.recipesDaily")}</p>
          <p className="secondary-text">{t("premium.instead")}</p>
        </div>

        <div className="what_you_get blue">
          <BubbleChartIcon />
          <p>{t("premium.editRecipesLive")}</p>
          <p className="secondary-text">{t("premium.withAi")}</p>
        </div>

        <div className="what_you_get red">
          <PsychologyIcon />
          <p>{t("premium.personalized")}</p>
        </div>
      </div>

<div className="box-selector">
  <Button
    className={`box-option monthly-box ${selected === "monthly" ? "selected" : ""}`}
    onClick={() => setSelected("monthly")}
    variant="contained"
  >
    <div className="plan-inner monthly-subscription-div">
      <p className="plan-name">{t("premium.monthly")}</p>
      <div className="plan-mini-divider" />

      <p className="price-line">
        {isRTL ? (
          <>
            <span className="price-ltr">9.9₪</span> / {t("premium.month")}
          </>
        ) : (
          <>
            <span className="price-ltr">9.9₪</span> / {t("premium.month")}
          </>
        )}
      </p>
    </div>
  </Button>

<Button
  className={`box-option annual-box ${selected === "annual" ? "selected" : ""}`}
  onClick={() => setSelected("annual")}
  variant="contained"
>
  <div className="annual-badge">
    <StarIcon className="badge-star" />
    <span>{t("premium.bestValue")}</span>
  </div>

  <div className="yearly-subscription-div">
    <p>{t("premium.annual")}</p>

    <p className="price-line">
      <span className="price-ltr">99₪</span> / {t("premium.year")}
    </p>
  </div>

  <div className="annual-save-box">
    <span>{t("premium.save")}</span>
  </div>
</Button>


</div>
<Button 
className="upgrade" 
  onClick={() => ("")}
  variant="contained"
>
<p>{t("premium.upgrade")}</p>
</Button>
<div className="divider"></div>
<p className="cancel-message">{t("premium.cancel")}</p>
    </div>
  );
}
