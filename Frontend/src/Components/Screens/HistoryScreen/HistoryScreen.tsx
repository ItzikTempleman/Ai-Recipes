import { useTitle } from "../../../Utils/UseTitle";
import "./HistoryScreen.css";

export function HistoryScreen() {
    useTitle("History Screen");
    
    return (
        <div className="HistoryScreen">
            <h2 className="HistoryTitle">History</h2>
        </div>
    );
}
