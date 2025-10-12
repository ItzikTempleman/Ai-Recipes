import { NavLink } from "react-router-dom";
import "./Header.css";
import FlatwareIcon from '@mui/icons-material/Flatware';
import HistoryIcon from '@mui/icons-material/History';

export function Header() {

  return (
    <div className="Header">
      <NavLink to="/recipe-screen" className="HomeLink">
        <FlatwareIcon className="HomeIcon" />
        <span className="HomeText">
          Generate <br/> recipe
        </span>
      </NavLink>
      <NavLink to="/history-screen" className="HistoryLink">
        <HistoryIcon className="HistoryIcon" />
        <span>History</span>
      </NavLink>
    </div>
  );
}