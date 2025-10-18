import { NavLink } from "react-router-dom";
import "./Header.css";
import ListIcon from '@mui/icons-material/List';
import FoodBank from "@mui/icons-material/FoodBank";

export function Header() {

  return (
    <div className="Header">
      <h2>AI Recipe generator</h2>
      <NavLink to="/create-screen" className="CreateLink">
        <FoodBank className="CreateIcon" />
        <span >
          Create
        </span>
      </NavLink>
      <NavLink to="/all-recipes-screen" className="AllRecipesLink">
        <ListIcon className="AllRecipesIcon" />
        <span>All recipes</span>
      </NavLink>
    </div>
  );
}