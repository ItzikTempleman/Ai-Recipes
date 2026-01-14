import { useTranslation } from "react-i18next";
import { useTitle } from "../../Utils/Utils";
import "./AboutScreen.css";
import { useEffect, useState } from "react";
import i18n from "../../Utils/i18n";



export function AboutScreen() {
useTitle("About");
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
 <div className={`AboutScreen ${isRTL ? "rtl" : "ltr"}`}>
 <p className="AboutScreenTitle">{t("about.title")}</p>
   <div className="AboutCard">
 <div className="TopSection"><h2 className="TopContent">{t("privacy.topSection")}</h2></div>
   <div className="RestOfSection"><h3 className="RestOfContent">{t("privacy.restOfSection")}</h3></div>
         </div>
            <div className="Copyrights">
            <p> {t("about.footer")}</p>
        </div>
    </div>
  );
}