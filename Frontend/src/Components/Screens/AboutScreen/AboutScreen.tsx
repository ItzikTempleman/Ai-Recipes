import { useTranslation } from "react-i18next";
import { useTitle } from "../../../Utils/Utils";
import "./AboutScreen.css";

export function AboutScreen() {
useTitle("About");
    const { t } = useTranslation();
  return (
    <div className="AboutScreen">
 <p className="AboutScreenTitle">{t("about.title")}</p>
   <div className="AboutCard">
 <div className="TopSection"><h2 className="TopContent">Welcome, I’m Itzik, a full-stack developer with a passion for combining creativity and technology. I built this platform to make recipe creation smarter, simpler, and more inspiring</h2></div>
   <div className="RestOfSection"><h3 className="RestOfContent">Using advanced AI tools, the site generates fully customized recipes—including clear instructions, ingredient lists, and even an image — across all languages and cuisines. <br/>I’m constantly adding new features to improve accuracy, personalization, and user experience. My goal is to help anyone, anywhere, turn their ideas into delicious dishes with just a few clicks</h3></div>
         </div>
            <div className="Copyrights">
            <p> {t("about.footer")}</p>
        </div>
    </div>
  );
}