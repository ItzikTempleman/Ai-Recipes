import { NavLink } from "react-router-dom";
import "./Page404.css";
import { useTranslation } from "react-i18next";
import { useTitle } from "../../../Utils/Utils";

export function Page404() {
    useTitle("Page not found")
    const { t } = useTranslation();

    return (
        <div className="Page404">
            <h1>404</h1>
            <p>{t("page404.message")}</p>
            <NavLink to="/home">{t("page404.return")}  </NavLink>
        </div>
    );
}
