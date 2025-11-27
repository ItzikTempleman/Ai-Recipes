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

export function getAge(birthDateStr: string): number {
  const today = new Date();

  // now we expect "DD/MM/YYYY"
  const [dayStr, monthStr, yearStr] = birthDateStr.split("/");
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  const birthDate = new Date(year, month - 1, day);

  let age = today.getFullYear() - birthDate.getFullYear();

  if (!didBirthDatPassThisYear(today, birthDate)) {
    age--;
  }

  return age;
}



function didBirthDatPassThisYear(today: Date, birthDate: Date): boolean {
    return today.getMonth() > birthDate.getMonth() ||
        (
            today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate()
        );
}