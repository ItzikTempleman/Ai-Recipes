import { useState } from "react";
import { DietaryRestrictions } from "../../Models/RecipeModel";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

type DietTypeProp = {
    onDietSelect: (dietType: DietaryRestrictions) => void
}

type DietMode = "Regular" | "Vegan" | "Kosher" | "Halal"


export function DietaryFilter(
    { onDietSelect }: DietTypeProp
) {
    const [dietMode, setDietMode] = useState<DietMode>("Regular")

    function toDietRestriction(mode: DietMode): DietaryRestrictions {
        switch (mode) {
            case "Vegan": return DietaryRestrictions.VEGAN;
            case "Kosher": return DietaryRestrictions.KOSHER;
            case "Halal": return DietaryRestrictions.HALAL;
            default: return DietaryRestrictions.DEFAULT;
        }
    }

    function handleDietTypeSelection(_: React.MouseEvent<HTMLElement>, selectedDiet: DietMode | null) {
        if (!selectedDiet) return;
        setDietMode(selectedDiet);
        const restrictionType = toDietRestriction(selectedDiet)
        onDietSelect(restrictionType);
    }

    return (
        <div>
            <ToggleButtonGroup value={dietMode} exclusive onChange={handleDietTypeSelection}>
                <ToggleButton value="Regular">No diet restriction</ToggleButton>
                <ToggleButton value="Vegan">Vegan</ToggleButton>
                <ToggleButton value="Kosher" >Kosher</ToggleButton>
                 <ToggleButton value="Halal">Halal</ToggleButton>
            </ToggleButtonGroup>
        </div>
    );
}


