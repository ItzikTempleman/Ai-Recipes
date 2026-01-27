import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../Utils/i18n";
import { useTitle } from "../../../Utils/Utils";
import "./PrivacyPolicy.css";

export function PrivacyPolicy() {

    useTitle("Privacy policy");
    const { t } = useTranslation();

    const [isRTL, setIsRTL] = useState<boolean>(() =>
        (i18n.language ?? "").startsWith("he")
    );

    useEffect(() => {
        const onLangChange = (lng: string) => setIsRTL((lng ?? "").startsWith("he"));
        i18n.on("languageChanged", onLangChange);
        return () => i18n.off("languageChanged", onLangChange);
    }, [i18n]);

    return (
        <div className={`PrivacyPolicy ${isRTL ? "rtl" : "ltr"}`}>
            <p className="PrivacyPolicyTitle">{t("privacy.title")}</p>
            <div className="PrivacyPolicyCard">

                <div className="PrivacyPolicyTopSection"><h2 className="TopContent">{t("privacy.topSection")}</h2></div>
                <div className="RestOfSection"><h3 className="RestOfContent">{t("privacy.restOfSection")}</h3></div>

            </div>
        </div>
    );
}
