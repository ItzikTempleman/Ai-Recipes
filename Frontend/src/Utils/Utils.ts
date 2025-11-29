import { useEffect } from "react";

export function useTitle(title: string): void {
    useEffect(() => {
        document.title = "AI Recipes | " + title
    }, [])
}

export function showDate(birthDateStr:string):string{
    if (!birthDateStr) return "";

     const [datePart] = birthDateStr.split("T");
     const [year, month, day] = datePart.split("-"); 


return `${day}/${month}/${year}`
}
export function getAge(
    birthDate: string | Date | null | undefined): number {
  if (!birthDate) return NaN;

  // Normalize to Date object:
  const d =
    birthDate instanceof Date
      ? birthDate
      : new Date(birthDate as string);

  // If still invalid, bail out:
  if (Number.isNaN(d.getTime())) return NaN;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }

  return age;
}
