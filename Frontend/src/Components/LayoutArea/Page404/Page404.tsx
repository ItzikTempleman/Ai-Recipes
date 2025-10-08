import { NavLink } from "react-router-dom";
import { useTitle } from "../../../Utils/UseTitle";
import "./Page404.css";

export function Page404() {
    useTitle("Page not found")
    return (
        <div className="Page404">
            <h1>404</h1>
			<p>The page you are looking for does'nt exist</p>
            <NavLink to={"/home"}>Return to home </NavLink>
        </div>
    );
}
