import { useTitle } from "../../../../Utils/UseTitle";
import "./LoginScreen.css";


export function LoginScreen() {
 useTitle("Login");
  return (
    <div className="LoginScreen">
 <p className="LoginScreenTitle">Login</p>
    </div>
  );
}