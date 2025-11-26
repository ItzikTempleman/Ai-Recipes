import { useEffect } from "react";

export function useTitle(title: string): void {
    useEffect(() => {
        document.title = "AI Recipes | " + title
    }, [])
}


export function getAge(birthDateStr: string): number {
    const today = new Date();
    const parts = birthDateStr.split("-");
    const numbers = parts.map(Number); //turns it into numbers
    const year = numbers[0];
    const month = numbers[1];
    const day = numbers[2];

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