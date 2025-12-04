import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import "./Filters.css";
import { SugarRestriction } from "../../../Models/RecipeModel";
import { useState } from "react";

type SugarLevelProp = {
    onSugarLevelSelect: (sugarLevel: SugarRestriction) => void
}

type SugarMode = "Regular" | "Low sugar" | "No sugar"

export function Filters(
    { onSugarLevelSelect }: SugarLevelProp
) {
    const [sugarMode, setSugarMode] = useState<SugarMode>("Regular")

    function toSugarRestriction(mode: SugarMode): SugarRestriction {
        switch (mode) {
            case "Low sugar": return SugarRestriction.LOW;
            case "No sugar": return SugarRestriction.NONE;
            default: return SugarRestriction.DEFAULT;
        }
    }

    function handleSugarLevelSelection(_: React.MouseEvent<HTMLElement>, selectedSugarLevel: SugarMode | null) {
        if (!selectedSugarLevel) return;
        setSugarMode(selectedSugarLevel);
        const restrictionLevel = toSugarRestriction(selectedSugarLevel)
        onSugarLevelSelect(restrictionLevel);
    }

    return (
        <div className="Filters">
            <ToggleButtonGroup value={sugarMode} exclusive onChange={handleSugarLevelSelection} className="FilterToggleGroup">
                <ToggleButton value="Regular" className="ToggleBtn">Regular</ToggleButton>
                <ToggleButton value="Low sugar" className="ToggleBtn">Low sugar</ToggleButton>
                <ToggleButton value="No sugar" className="ToggleBtn">No sugar</ToggleButton>
            </ToggleButtonGroup>
        </div>
    );
}