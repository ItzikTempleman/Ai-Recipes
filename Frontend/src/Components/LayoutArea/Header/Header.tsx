import { NavLink } from "react-router-dom";
import "./Header.css";
import FlatwareIcon from '@mui/icons-material/Flatware';
import HistoryIcon from '@mui/icons-material/History';
export function Header() {
  return (
    <div className="Header">
 
           <NavLink to="/home" className="HomeLink">
              <div><FlatwareIcon />
              <div className="HomeDivText">Recipes</div>
              </div>
            </NavLink>
            <NavLink to="/search-history" className="HistoryLink">
              <div><HistoryIcon/>
                <div className="HistoryDivText">History</div>
              </div>
            </NavLink>
 
    </div>
  );
}