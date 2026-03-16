import { useEffect, useState } from "react";
import "./AdminScreen.css";
import { adminService } from "../../../Services/AdminService";
import { useTitle } from "../../../Utils/Utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";

type Statistics = {
    usersEnteredSite: number,
    guestsEnteredSite: number,
    usersWhoGeneratedRecipes: number,
    guestsWhoGeneratedRecipes: number,
    totalRecipesGenerated: number
}

export function AdminScreen() {
    useTitle("Admin stats");
    const { t } = useTranslation();
    const [data, setData] = useState<Statistics | null>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
}, []);

    useEffect(() => {
        adminService.getStatistics().then((stats) => setData(stats)).catch((err) => console.error(err));
    }, []);

    if (!data) return <p>{t("adminStats.loading")}</p>;

    const chartData = [
        { name: t("adminStats.usersEnteredSite"), value: data.usersEnteredSite },
        { name: t("adminStats.guestsEnteredSite"), value: data.guestsEnteredSite },
        { name: t("adminStats.usersWhoGeneratedRecipes"), value: data.usersWhoGeneratedRecipes },
        { name: t("adminStats.guestsWhoGeneratedRecipes"), value: data.guestsWhoGeneratedRecipes },
        { name: t("adminStats.totalRecipesGenerated"), value: data.totalRecipesGenerated }
    ];


    return (
        <div className="AdminScreen">
            <h2>{t("adminStats.title")}</h2>

            <div className="chartBox">
                <ResponsiveContainer width="100%" height={460}>
                    <BarChart data={chartData} barCategoryGap="18%">
                        <CartesianGrid strokeDasharray="4 4" />
                        <XAxis
                            dataKey="name"
                            interval={0}
                            angle={isMobile ? -25 : 0}
                            textAnchor={ "center"}
                            height={100}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" className="adminBar" radius={[8, 8, 0, 0]} barSize={36} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}