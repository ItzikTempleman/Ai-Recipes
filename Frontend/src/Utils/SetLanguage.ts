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

    useEffect(() => {
        const onLangChange = (lng: string) => {
            const lang = (lng ?? "").startsWith("he") ? "he" : "en";
            localStorage.setItem(LANGUAGE_KEY, lang);
            setLanguage(lang);
        };

        i18n.on("languageChanged", onLangChange);
        return () => i18n.off("languageChanged", onLangChange);
    }, [i18n]);

    function setLang(language: Language) {
        setLanguage(language);
        localStorage.setItem(LANGUAGE_KEY, language);
        i18n.changeLanguage(language);
    }

    const isRtl = initialLanguage === "he";
    return { initialLanguage, setLang, isRtl };
}