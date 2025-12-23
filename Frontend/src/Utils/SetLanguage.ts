import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type Language = "en" | "he";
const LANGUAGE_KEY = "selectedLanguage";

export function getStoredLanguage(): Language {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === "he" || stored === "en" ? stored : "en";
}

export function useLanguage() {
    const { i18n } = useTranslation();
    const [initialLanguage, setLanguage] = useState<Language>(() => getStoredLanguage());

    useEffect(() => {
        if (i18n.language !== initialLanguage) i18n.changeLanguage(initialLanguage);
    }, []);

    function setLang(language: Language) {
        setLanguage(language);
        localStorage.setItem(LANGUAGE_KEY, language);
        i18n.changeLanguage(language);
    }

    const isRtl = initialLanguage === "he";
    return { initialLanguage, setLang, isRtl };
}