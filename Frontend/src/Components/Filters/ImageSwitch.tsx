import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  onChange: (hasImage: boolean) => void;
  defaultHasImage?: boolean;
};

type Mode = "No Image" | "Full";

export function ImageSwitch({ onChange, defaultHasImage = false }: Props) {
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>(defaultHasImage ? "Full" : "No Image");

  useEffect(() => {
    onChange(defaultHasImage);
  }, [defaultHasImage, onChange]);

  function handleChange(_: React.MouseEvent<HTMLElement>, selected: Mode | null) {
    if (!selected) return;

    setMode(selected);

    const hasImage = selected === "Full";
    onChange(hasImage);
  }

  return (
    <ToggleButtonGroup value={mode} exclusive onChange={handleChange}>
      <ToggleButton value="No Image">{t("filters.image.noImage")}</ToggleButton>
      <ToggleButton value="Full">{t("filters.image.withImage")}</ToggleButton>
    </ToggleButtonGroup>
  );
}