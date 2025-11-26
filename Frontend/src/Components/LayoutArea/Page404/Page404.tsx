import { NavLink } from "react-router-dom";
import { useTitle } from "../../../Utils/Utils";
import { useSelector } from "react-redux";
import { AppState } from "../../../Redux/Store";
import { accountProtection } from "../../../Utils/AccountProtection";
import "./Page404.css";

export function Page404() {
    useTitle("Page not found")

    const user = useSelector((state: AppState) => state.user);
    const isLoggedIn = !!user && accountProtection.isUser();

    return (
        <div className="Page404">
            <h1>404</h1>
            <p>The page you are looking for does'nt exist</p>
            <NavLink to={isLoggedIn
                ? "/home-screen" : "/login-screen"}>Return  </NavLink>
        </div>
    );
}
