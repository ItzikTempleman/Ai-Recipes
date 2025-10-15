import { NavLink } from "react-router-dom";
import "./Header.css";
import HistoryIcon from '@mui/icons-material/History';
import FoodBank from "@mui/icons-material/FoodBank";

export function Header() {

  return (
    <div className="Header">
      <NavLink to="/recipe-screen" className="RecipeLink">
        <FoodBank className="RecipeIcon" />
        <span className="RecipeText">
          Generate
        </span>
      </NavLink>
      <NavLink to="/history-screen" className="HistoryLink">
        <HistoryIcon className="HistoryIcon" />
        <span>History</span>
      </NavLink>
    </div>
  );
}