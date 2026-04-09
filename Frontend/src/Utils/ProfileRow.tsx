import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import WcOutlinedIcon from "@mui/icons-material/WcOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export type ProfileRow = {
  key: string;
  icon: ReactNode;
  label: string;
  value?: string;
  visible?: boolean;
  trailing?: ReactNode;
  section: "info" | "actions";
  onClick?: () => void;
};

type GetProfileRowsParams = {
  t: TFunction;
  language: string;
  phoneNumber?: string;
  birthDateStr?: string;
  ageText?: string;
  genderText?: string;
  isPremium: boolean;
  onPhoneClick?: () => void;
  onBirthdateClick?: () => void;
  onGenderClick?: () => void;
  onAccountSettingsClick?: () => void;
  onSavedRecipesClick?: () => void;
  onSubscriptionClick?: () => void;
  onLanguageClick?: () => void;
};

export function getProfileRows({
  t,
  language,
  phoneNumber,
  birthDateStr,
  ageText,
  genderText,
  isPremium,
  onPhoneClick,
  onBirthdateClick,
  onGenderClick,
  onAccountSettingsClick,
  onSavedRecipesClick,
  onSubscriptionClick,
  onLanguageClick,
}: GetProfileRowsParams): ProfileRow[] {
  return [
    {
      key: "phone",
      icon: <PhoneOutlinedIcon />,
      label: t("profile.phoneNumber"),
      value: phoneNumber?.trim() || "",
      visible: Boolean(phoneNumber?.trim()),
      trailing: <ChevronRightIcon className="ProfileRowChevron" />,
      section: "info",
      onClick: onPhoneClick,
    },
    {
      key: "birthdate",
      icon: <CakeOutlinedIcon />,
      label: t("profile.birthdate"),
      value: birthDateStr || "",
      visible: Boolean(birthDateStr),
      trailing: <ChevronRightIcon className="ProfileRowChevron" />,
      section: "info",
      onClick: onBirthdateClick,
    },
    {
      key: "age",
      icon: <PersonOutlineOutlinedIcon />,
      label: t("profile.age"),
      value: ageText || "",
      visible: Boolean(ageText),
      section: "info",
    },
    {
      key: "gender",
      icon: <WcOutlinedIcon />,
      label: t("profile.gender"),
      value: genderText || "",
      visible: Boolean(genderText),
      trailing: <ChevronRightIcon className="ProfileRowChevron" />,
      section: "info",
      onClick: onGenderClick,
    },
    {
      key: "accountSettings",
      icon: <ManageAccountsOutlinedIcon />,
      label: t("profile.accountSettings"),
      trailing: <ChevronRightIcon className="ProfileRowChevron" />,
      section: "actions",
      onClick: onAccountSettingsClick,
    },
    {
      key: "savedRecipes",
      icon: <FavoriteBorderOutlinedIcon />,
      label: t("profile.savedRecipes"),
      trailing: <ChevronRightIcon className="ProfileRowChevron" />,
      section: "actions",
      onClick: onSavedRecipesClick,
    },
    {
      key: "subscription",
      icon: <WorkspacePremiumOutlinedIcon className="SubscriptionIcon" />,
      label: t("profile.subscription"),
      trailing: isPremium ? (
        <div className="PremiumBadgeProfile">{t("drawer.premium")}</div>
      ) : (
        <ChevronRightIcon className="ProfileRowChevron" />
      ),
      section: "actions",
      onClick: onSubscriptionClick,
    },
    {
      key: "language",
      icon: <LanguageOutlinedIcon />,
      label: t("profile.language"),
      value: language.startsWith("he")
        ? t("drawer.hebrew")
        : t("drawer.english"),
      trailing: <ChevronRightIcon className="ProfileRowChevron" />,
      section: "actions",
      onClick: onLanguageClick,
    },
  ];
}