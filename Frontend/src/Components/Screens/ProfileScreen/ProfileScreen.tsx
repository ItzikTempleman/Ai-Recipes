import { useTitle } from "../../../Utils/UseTitle";
import "./ProfileScreen.css";

export function ProfileScreen() {
useTitle("Profile");
  return (
    <div className="ProfileScreen">
 <p className="ProfileScreenTitle">Profile</p>
    </div>
  );
}