import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import "./RecipeSwitch.css";

type Props = {
  onChange: (hasImage: boolean) => void;
};

type Mode = "NoImage" | "Full";

export function RecipeSwitch(
  { onChange }:Props) {
  const [mode, setMode] = useState<Mode>("NoImage");

  function handleChange(_: React.MouseEvent<HTMLElement>, selected: Mode | null) {
    if (!selected) return;
    setMode(selected);
    onChange(selected === "Full"); 
  }


  return (
    <div className="RecipeSwitch">
  
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
        className="ToggleGroup"
      >
         <ToggleButton value="NoImage" className="ToggleBtn">No Image</ToggleButton>
                <ToggleButton value="Full" className="ToggleBtn">Full</ToggleButton>
       

      </ToggleButtonGroup>
    </div>
  );
}