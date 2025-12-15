import { NavLink } from "react-router-dom";
import { useTitle } from "../../../Utils/Utils";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import "./Page404.css";
import { useTranslation } from "react-i18next";

export function Page404() {
    useTitle("Page not found")
    const { t } = useTranslation();
    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = user && localStorage.getItem("token");

    return (
        <div className="Page404">
            <h1>404</h1>
            <p>{t("page404.message")}</p>
            <NavLink to={isLoggedIn
                ? "/home" : "/login"}>{t("page404.return")}  </NavLink>
        </div>
    );
}
