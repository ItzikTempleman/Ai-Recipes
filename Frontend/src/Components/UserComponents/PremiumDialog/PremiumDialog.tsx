import { useTranslation } from "react-i18next";
import "./PremiumDialog.css";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";

type CloseDialogProps = {
  onClose: () => void;
};

export function PremiumDialog({onClose}: CloseDialogProps) {
    const { t } = useTranslation();

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
<div className="divider"></div>
        </div>
    )
}