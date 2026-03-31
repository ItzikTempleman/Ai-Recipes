import { useTranslation } from "react-i18next";
import "./PremiumDialog.css";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useState } from "react";
import Button from "@mui/material/Button";

type CloseDialogProps = {
  onClose: () => void;
};

type SubscriptionType = "monthly" | "annual";

export function PremiumDialog({ onClose }: CloseDialogProps) {
  const { t } = useTranslation();

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


      <div>

        <Button
          className={`box-option ${selected === "monthly" ? "selected" : ""}`}
          onClick={() => setSelected("monthly")}
          variant="contained"
        >
          <div className="monthly-subscription-div">
            <p>{t("premium.monthly")}</p>
          </div>
        </Button>

        <Button
          className={`box-option ${selected === "annual" ? "selected" : ""}`}
          onClick={() => setSelected("annual")}
           variant="contained"
        >
          <div className="yearly-subscription-div">
            <p >{t("premium.annual")}</p>
          </div>
        </Button>
      </div>




    </div>
  );
}