import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  onChange: (hasImage: boolean) => void;
};

type Mode = "Full" | "No Image";

export function ImageSwitch(
  { onChange }: Props) {
  const [mode, setMode] = useState<Mode>("Full");
 const { t } = useTranslation();
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
        <ToggleButton value="Full" >{t("filters.image.withImage")}</ToggleButton>
        <ToggleButton value="No Image" >{t("filters.image.noImage")}</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}