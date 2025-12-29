import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import "./ImageSwitch.css";
import HideImageOutlinedIcon from '@mui/icons-material/HideImageOutlined';
import ImageIcon from '@mui/icons-material/Image';

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
  <div className="ImageSwitchDiv">
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleChange}
      className="imageSwitch"
    >
      <ToggleButton value="No Image">{t("filters.image.noImage")}</ToggleButton>
      <ToggleButton value="Full">{t("filters.image.withImage")}</ToggleButton>
    </ToggleButtonGroup>

    <div className="ImageSwitchIconsRow">
      <HideImageOutlinedIcon className="imageSwitchIcon-NoImage" />
      <ImageIcon className="imageSwitchIcon" />
    </div>
  </div>
  );
}