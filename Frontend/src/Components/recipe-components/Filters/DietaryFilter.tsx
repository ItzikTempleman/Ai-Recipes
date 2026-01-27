import { useState } from "react";
import { DietaryRestrictions } from "../../../Models/RecipeModel";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

type DietTypeProp = {
    onDietSelect: (dietType: DietaryRestrictions) => void
}

type DietMode = "Regular" | "Vegan" | "Kosher" 


export function DietaryFilter(
    { onDietSelect }: DietTypeProp
) {
    const [dietMode, setDietMode] = useState<DietMode>("Regular")
 const { t } = useTranslation();
    function toDietRestriction(mode: DietMode): DietaryRestrictions {
        switch (mode) {
            case "Vegan": return DietaryRestrictions.VEGAN;
            case "Kosher": return DietaryRestrictions.KOSHER;
        
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
                <ToggleButton value="Regular">{t("filters.diet.none")}</ToggleButton>
                <ToggleButton value="Vegan">{t("filters.diet.vegan")}</ToggleButton>
                <ToggleButton value="Kosher" >{t("filters.diet.kosher")}</ToggleButton>
            
            </ToggleButtonGroup>
        </div>
    );
}


