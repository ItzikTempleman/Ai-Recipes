import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

type Props = {
  onChange: (hasImage: boolean) => void;
};

type Mode = "Full" | "No Image";

export function ImageSwitch(
  { onChange }: Props) {
  const [mode, setMode] = useState<Mode>("Full");

  function handleChange(_: React.MouseEvent<HTMLElement>, selected: Mode | null) {
    if (!selected) return;
    setMode(selected);
    onChange(selected === "No Image");
  }

  return (
    <div>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
        className="ToggleGroup">
        <ToggleButton value="Full" className="ToggleBtn">With image</ToggleButton>
        <ToggleButton value="No Image" className="ToggleBtn">No image</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}