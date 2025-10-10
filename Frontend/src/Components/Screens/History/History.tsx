import { useTitle } from "../../../Utils/UseTitle";
import "./History.css";

export function History() {
    useTitle("History");
    
    return (
        <div className="History">
            <h2 className="HistoryTitle">History</h2>
        </div>
    );
}
