import { useSelector } from "react-redux";
import { getAge, showDate, useTitle } from "../../../Utils/Utils";
import "./ProfileScreen.css";
import { AppState } from "../../../Redux/Store";


export function ProfileScreen() {

  const user = useSelector((state: AppState) => state.user);

  useTitle("Profile");

    const birthDateStr = showDate(user.birthDate)


    
const gender = user.gender ?? (user as any).Gender ?? "";
    const age = birthDateStr ? getAge(birthDateStr) : "";
  return (
    <div className="ProfileScreen">
      <h2 className="ProfileScreenTitle">Profile</h2>

      <div className="ProfileSection">

<p>{user.firstName} {user.familyName}</p>
<p>Age: {age}</p>
<p>Email: {user.email}</p>
<p>Gender: {gender}</p>
<p>Phone number: {user.phoneNumber}</p>
<p>Birth date: {birthDateStr}</p>
      </div>
    </div>
  );
}