import { useTitle } from "../../../Utils/UseTitle";
import "./History.css";

export function History() {
    useTitle("History");
    
    return (
        <div className="History">
            <h4 className="history-screen">Recipe history</h4>
        </div>
    );
}
