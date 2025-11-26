import { useTitle } from "../../../Utils/Utils";
import "./AboutScreen.css";

export function AboutScreen() {
useTitle("About");
  return (
    <div className="AboutScreen">
 <p className="AboutScreenTitle">About</p>
    </div>
  );
}