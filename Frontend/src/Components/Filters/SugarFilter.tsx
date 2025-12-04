import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useState } from "react";
import { SugarRestriction } from "../../Models/RecipeModel";

type SugarLevelProp = {
    onSugarLevelSelect: (sugarLevel: SugarRestriction) => void
}

type SugarMode = "Regular sugar" | "Low sugar" | "No sugar"

export function SugarFilter(
    { onSugarLevelSelect }: SugarLevelProp
) {
    const [sugarMode, setSugarMode] = useState<SugarMode>("Regular sugar")

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
        <div className="SugarFilter">
            <ToggleButtonGroup value={sugarMode} exclusive onChange={handleSugarLevelSelection} className="FilterToggleGroup">
                <ToggleButton value="Regular sugar" className="ToggleBtn">Regular sugar</ToggleButton>
                <ToggleButton value="Low sugar" className="ToggleBtn">Low sugar</ToggleButton>
                <ToggleButton value="No sugar" className="ToggleBtn">Sugar free</ToggleButton>
            </ToggleButtonGroup>
        </div>
    );
}


