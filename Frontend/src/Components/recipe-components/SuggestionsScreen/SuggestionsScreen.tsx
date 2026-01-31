import { useSelector } from "react-redux";
import { useTitle } from "../../../Utils/Utils";
import "./SuggestionsScreen.css";
import { AppState } from "../../../Redux/Store";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function SuggestionsScreen() {
    useTitle("Suggested");
    const { items } = useSelector((state: AppState) => state.recipes);
    const user = useSelector((state: AppState) => state.user);
    const { t, i18n } = useTranslation();
    const isRTL = (i18n.language ?? "").startsWith("he");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        //TODO
    }, [user?.id]);

    return (
        <div className="SuggestionsScreen">


        </div>
    );
}

