import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import "./ImageSwitch.css";

type Props = {
  onChange: (hasImage: boolean) => void;
};

type Mode = "NoImage" | "Full";

export function ImageSwitch(
  { onChange }:Props) {
  const [mode, setMode] = useState<Mode>("NoImage");

  function handleChange(_: React.MouseEvent<HTMLElement>, selected: Mode | null) {
    if (!selected) return;
    setMode(selected);
    onChange(selected === "Full"); 
  }


  return (
    <div className="ImageSwitch">
  
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