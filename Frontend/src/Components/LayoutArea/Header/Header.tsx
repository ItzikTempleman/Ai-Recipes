import { NavLink } from "react-router-dom";
import "./Header.css";

export function Header() {
  return (
    <div className="Header">
      <h2 className="SiteTitle">Smart recipes</h2>
      <div className="NavLinkContainer">
        <NavLink to="/home">
          <h3>Home</h3>
        </NavLink> |
        <NavLink to="/search-history">
          <h3>History</h3>
        </NavLink>
      </div>
    </div>
  );
}