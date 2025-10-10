import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import "./RecipeSwitch.css";

export function RecipeSwitch() {
  const [mode, setMode] = useState<"NoImage" | "Full">("NoImage");

  function handleChange(_: React.MouseEvent<HTMLElement>, selectedMode: "NoImage" | "Full" | null) {
    if (selectedMode !== null) setMode(selectedMode);
  }

  return (
    <div className="RecipeSwitch">
  
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
        className="ToggleGroup"
      >
                <ToggleButton value="Full" className="ToggleBtn">
          Full
        </ToggleButton>
        <ToggleButton value="NoImage" className="ToggleBtn">
          No Image
        </ToggleButton>

      </ToggleButtonGroup>
    </div>
  );
}