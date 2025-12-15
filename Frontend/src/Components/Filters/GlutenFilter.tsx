import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React, { useState } from "react";
import { GlutenRestrictions } from "../../Models/RecipeModel";
import { useTranslation } from "react-i18next";


type GlutenProp={
    onChange:(containsGluten:GlutenRestrictions)=>void;
}

type GlutenMode = "Regular Gluten" | "No Gluten";

export function GlutenFilter(
  
    {onChange}:GlutenProp){
       const { t } = useTranslation();
    const [glutenMode, setGlutenMode]= useState<GlutenMode>("Regular Gluten");

    function handleChange(_:React.MouseEvent<HTMLElement>, selected:GlutenMode |null){
         if (!selected) return;
         setGlutenMode(selected);
         onChange(selected === "No Gluten"? GlutenRestrictions.NONE: GlutenRestrictions.DEFAULT);
    }

   return (
        <div>
      <ToggleButtonGroup
        value={glutenMode}
        exclusive
        onChange={handleChange}>
        <ToggleButton value="Regular Gluten">{t("filters.gluten.regular")}</ToggleButton>
         <ToggleButton value="No Gluten">{t("filters.gluten.none")}</ToggleButton>
      </ToggleButtonGroup>
    </div>
   )


}