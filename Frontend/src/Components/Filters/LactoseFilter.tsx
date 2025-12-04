import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React, { useState } from "react";
import { LactoseRestrictions } from "../../Models/RecipeModel";


type LactoseProp={
    onChange:(containsLactose:LactoseRestrictions)=>void;
}

type LactoseMode = "Regular milk" | "No Lactose";

export function LactoseFilter(
    {onChange}:LactoseProp){
    const [lactoseMode, setLactoseMode]= useState<LactoseMode>("Regular milk");

    function handleChange(_:React.MouseEvent<HTMLElement>, selected:LactoseMode |null){
         if (!selected) return;
         setLactoseMode(selected);
         onChange(selected === "No Lactose"? LactoseRestrictions.NONE: LactoseRestrictions.DEFAULT);
    }

   return (
        <div>
      <ToggleButtonGroup
        value={lactoseMode}
        exclusive
        onChange={handleChange}>
        <ToggleButton value="Regular milk">Regular milk</ToggleButton>
         <ToggleButton value="No Lactose">Lactose free</ToggleButton>
      </ToggleButtonGroup>
    </div>
   )


}