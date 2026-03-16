import { useState } from "react";
import "./AdminScreen.css";
import { adminService } from "../../../Services/AdminService";


type Statistics = {
    usersEnteredSite: number,
    guestsEnteredSite: number,
    usersWhoGeneratedRecipes: number,
    guestsWhoGeneratedRecipes: number,
    totalRecipesGenerated: number
}

export function AdminScreen() {
const adminStats=  adminService.getStatistics()

  const [data, setData] = useState<Statistics[]>([]);



    return (
        <div className="AdminScreen">

        </div>
    );
}