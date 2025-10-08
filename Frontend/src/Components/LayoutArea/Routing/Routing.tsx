import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "../../Screens/Home/Home";
import { Page404 } from "../Page404/Page404";



export function Routing() {

    return (
        <div>
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="*" element={<Page404/>} />
                <Route path="/home" element={<Home/>} />
     

            </Routes>
        </div>
    );
}
