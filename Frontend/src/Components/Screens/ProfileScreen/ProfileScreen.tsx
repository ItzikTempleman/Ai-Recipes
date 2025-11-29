import { useSelector } from "react-redux";
import { getAge, showDate, useTitle } from "../../../Utils/Utils";
import "./ProfileScreen.css";
import { AppState } from "../../../Redux/Store";


export function ProfileScreen() {

  const user = useSelector((state: AppState) => state.user);

  useTitle("Profile");
  if (!user) return null;

  const rawBirthDate = user.birthDate ?? "";           // "1997-07-09T00:00:00.000Z"
  const birthDateStr = showDate(rawBirthDate);         // "09/07/1997"
  const gender = user.gender ?? (user as any).Gender ?? "";

  // Use the ISO date part (YYYY-MM-DD) for age calculation:
  const isoDate = rawBirthDate.split("T")[0];          // "1997-07-09"
  const age = isoDate ? getAge(isoDate) : "";

  return (
    <div className="ProfileScreen">
      <p className="ProfileScreenTitle">Profile</p>

      <div className="ProfileSection">

<p>{user.firstName} {user.familyName}, {age}, {gender}</p>
<div className="divider" />
<p>Email: {user.email}</p>
<p>phone number: {user.phoneNumber}</p>
<p>birth date: {birthDateStr}</p>
      </div>
    </div>
  );
}