

import { useTranslation } from "react-i18next";
import { useTitle } from "../../../Utils/Utils";
import "./DataDeletion.css";
import { useEffect, useState } from "react";
import i18n from "../../../Utils/i18n";

export function DataDeletion() {

useTitle("Delete data");
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
       <div className={`DataDeletion ${isRTL ? "rtl" : "ltr"}`}>
 <p className="DataDeletionTitle">{t("dataDeletion.title")}</p>

  
        </div>
    );
}
