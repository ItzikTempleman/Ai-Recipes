import { useTitle } from "../../../Utils/UseTitle";
import "./AboutScreen.css";

export function AboutScreen() {
useTitle("About");
  return (
    <div className="AboutScreen">
 <p className="AboutScreenTitle">About</p>
    </div>
  );
}