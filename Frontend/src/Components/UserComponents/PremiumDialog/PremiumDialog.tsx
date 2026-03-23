import { useTranslation } from "react-i18next";
import "./PremiumDialog.css";



export function PremiumDialog() {
    const { t } = useTranslation();

    return (
        <div className="PremiumDialog">
         <h3>{t("drawer.upgrade")}</h3>
        </div>
    )
}