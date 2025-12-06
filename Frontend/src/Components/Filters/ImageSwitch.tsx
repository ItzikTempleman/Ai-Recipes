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
        const hasImage = selected === "Full";
    onChange(hasImage);
  }

  return (
    <div>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
       >
        <ToggleButton value="Full" >With image</ToggleButton>
        <ToggleButton value="No Image" >No image</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}