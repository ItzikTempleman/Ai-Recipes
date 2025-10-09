import { useTitle } from "../../../Utils/UseTitle";
import "./Home.css";

export function Home() {
    useTitle("Home");
    
    return (
        <div className="Home">
            <h4 className="search">Search any recipe in any language</h4>
        </div>
    );
}

