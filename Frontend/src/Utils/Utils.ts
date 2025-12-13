import { useEffect } from "react";
import { DifficultyLevel } from "../Models/RecipeModel";
import { LANGUAGE } from "../Components/DrawerLayout/DrawerLayout";

export function useTitle(title: string): void {
  useEffect(() => {
    document.title = "Itzik ai recipes Recipes | " + title
  }, [])
}

export function showDate(birthDateStr: string): string {
  if (!birthDateStr) return "";
  const [datePart] = birthDateStr.split("T");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`
}


export function getAge(
  birthDate: string | Date | null | undefined): number {
  if (!birthDate) return NaN;

  const d =
    birthDate instanceof Date
      ? birthDate
      : new Date(birthDate as string);
  if (Number.isNaN(d.getTime())) return NaN;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

export function isAgeOk(chosenDate: Date): boolean {
  const selectedAge = getAge(chosenDate);
  return selectedAge > 12;
}


const decimalToFractionMap: Record<string, string> = {
  "0.5": "½",
  "0.25": "¼",
  "0.75": "¾",
  "0.33": "⅓",
  "0.3": "⅓",
};

export function formatAmount(raw: string | null | undefined): string {
  if (!raw) return "";

  return raw.replace(
    /\b0\.\d+\b/g,
    (match) => decimalToFractionMap[match] ?? match
  );
}

export type Level = {
  label: string,
  icon: string
}


export function getDifficultyLevel(level?: DifficultyLevel): Level {
  switch (level) {
    case DifficultyLevel.EASY:
      return {
        label: "Easy",
        icon: "/easy.png"
      }
    case DifficultyLevel.MID_LEVEL:
      return {
        label: "Mid-level",
        icon: "/mid-level.png"
      }
    case DifficultyLevel.PRO:
      return {
        label: "Hard",
        icon: "/hard.png"
      }
    default:
      return {
        label: "Easy",
        icon: "/easy.png",
      };
  }
}


export function changeLanguage(lang: LANGUAGE): LANGUAGE {
  return lang
}

export function toggleDarkMode(isDarkMode: boolean): boolean {
  return isDarkMode
}