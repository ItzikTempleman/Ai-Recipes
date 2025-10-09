import { NavLink } from "react-router-dom";
import "./Header.css";

export function Header() {
    return (
        <div className="Header">
            <h2 className="site-title">Smart recipes </h2>
            <div className="nav-link">
                <NavLink to="/home">Home</NavLink>
                <NavLink to="/search-history">History</NavLink>
            </div>
        </div>
    );
}
