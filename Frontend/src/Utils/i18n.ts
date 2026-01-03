import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getRestOfSectionEn, getRestOfSectionHe, getTopSectionEn, getTopSectionHe } from "./AboutSections";

const resources = {
  en: {
    translation: {
      nav: {
        return:"Resume",
        likes:"Likes",
        home: "Home",
        generate: "Create",
        about: "About this site",
        selectLanguage: "Language"
      },
      drawer: {
        profile: "Profile",
        english: "English",
        hebrew: "עברית",
        logout: "Logout",
        helloGuest: "Hello Guest",
        login: "Log in",
      },
      homeScreen: {
        shareIntro: "Share your recipes",
        generate: "Generate a recipe",
        siteTitle: "Ai recipe generator",
        hello: "Hello",
        guest: "guest",
        recentlyViewed: "Recently viewed",
        noRecipes: "Blank history",
        guestNoticeLine1: "Generate recipes freely",
        guestNoticeLine2: "Log in to save or view history"
      },
      about: {
        title: "About this site",
        topSection: getTopSectionEn(),
        restOfSection: getRestOfSectionEn(),
        footer: "© 2025 All rights reserved ® Itzik's AI recipe generator",
      },
      page404: {
        title: "Page not found",
        message: "The page you are looking for does'nt exist",
        return: "Return",
      },
      generate: {
             withImage:"With image",
         withoutImage:"Without image",
        filters:"Filters",
        youCanGenerateImageLater: "You can add an image later",
        guest: "Guest",
        title: "Generate recipes with AI",
        labelGenerate: "Generate recipe",
        quantitySelector: "Servings",
        requiredTitle: "title is required",
        go: "Go",
        excludeIngredient: "Exclude items",
        loadingWithImage: "Generating an image…",
        loadingWithImageLowerMessage: "This will take a minute",
        loadingNoImage: "Generating a recipe…",
      },
      likeScreen:{
  likedTitle:"Favorites"
},
      filters: {
        image: {
          image:"Image",
          withImage: "ON",
          noImage: "OFF",
        },
        sugar: {
          regular: "Regular sugar",
          low: "Low sugar",
          none: "Sugar free",
        },
        lactose: {
          regular: "Regular milk",
          none: "Lactose free",
        },
        gluten: {
          regular: "Regular gluten",
          none: "Gluten free",
        },
        diet: {
          none: "None",
          vegan: "Vegan",
          kosher: "Kosher"
        },
      },
      auth: {
        login: {
          title: "Log in",
          emailLabel: "Enter Email",
          emailPlaceholder: "Email",
          passwordLabel: "Enter password",
          passwordPlaceholder: "Password",
          submit: "Log in",
          registerLink: "Register"
        },

        registration: {
          title: "Registration",
          back: "Back",
          firstNameLabel: "First name",
          firstNamePlaceholder: "first name",
          lastNameLabel: "Last name",
          lastNamePlaceholder: "last name",
          emailLabel: "Enter email",
          emailPlaceholder: "Email",
          passwordLabel: "Enter password",
          passwordPlaceholder: "Password",
          birthDateLabel: "Birth date",
          phoneLabel: "Enter phone number",
          phonePlaceholder: "Phone number",
          male: "Male",
          female: "Female",
          other: "Other",
          submit: "Register",
          firstNameRequired: "First name is required",
          lastNameRequired: "Last name is required",
          min3Chars: "Minimum 3 characters required",
          emailRequired: "Email is required",
          emailInvalid: "Enter a valid email",
          passwordRequired: "Password is required",
          passwordMin8: "At least 8 characters",
          birthDateRequired: "Birth date is required",
          birthDateFuture: "Birth date cannot be in the future",
          minAge12: "User must be at least 12 to register",
          phoneRequired: "Phone number is required",
        },
      },
      profile: {
        title: "Profile",
        edit: "Edit",
        updateFirstName: "Update first name",
        updateLastName: "Update last name",
        updateEmail: "Update email",
        updatePhone: "Update phone number",
        updateProfile: "Update profile",
        emailPrefix: "Email:",
        phonePrefix: "phone number:",
        birthDatePrefix: "birth date:",
        userUpdated: "User has been updated",
        imageUpdated: "Profile image updated",
      },
      recipeUi: {
        share: "Share",
        instructions: "Instructions",
        ingredients: "Ingredients",
        loadImage: "Load image",
        clear: "Clear",
        showRecipe: "Show Recipe",
        back: "Back",
        infoTitle: "Info",
        calories: "Calories",
        sugar: "Sugar",
        protein: "Protein",
        health: "Health",
        kcal: "kcal",
      },
      difficulty: {
        easy: "Easy",
        midLevel: "Mid-level",
        hard: "Hard",
      },
      units: {
        gramShort: "g",
        tbspShort: "tbs",
        per100g: "| 100g",
        minuteShort: "m",
      },
      notify: {
        genericError: "Some error, please try again.",
      },
    },
  },

  he: {
    translation: {
      nav: {
        return:"המשך",
        likes:"אהבתי",
        home: "בית",
        generate:"מתכון",
        about: "אודות האתר",
        selectLanguage: "שפה",
      },

      drawer: {
        profile: "פרופיל",
        english: "English",
        hebrew: "עברית",
        logout: "התנתק",
        helloGuest: "שלום אורח",
        login: "התחבר",
      },

      homeScreen: {
        shareIntro: "שתף את המתכונים",
        generate: "יצירת מתכון",
        siteTitle: "יוצר מתכונים חכם",
        hello: "שלום",
        guest: "אורח",
        recentlyViewed: "נצפו לאחרונה",
        noRecipes: "אין היסטוריה",
        guestNoticeLine1: "ניתן ליצור מתכונים בלי להתחבר",
        guestNoticeLine2: "התחברות נדרשת לשמירה ולהיסטוריה"
      },

      about: {
        title: "אודות אתר זה",
        topSection: getTopSectionHe(),
        restOfSection: getRestOfSectionHe(),
        footer: "© 2025 כל הזכויות שמורות ® מחולל המתכונים של איציק",
      },

      page404: {
        message: "הדף שחיפשת לא קיים",
        return: "חזרה",
      },

      generate: {
        withImage:"עם תמונה",
         withoutImage:"ללא תמונה",
        filters:"סינון",
        youCanGenerateImageLater: "תמיד ניתן להוסיף תמונה אחר כך",
        guest: "אורח",
        title: "כאן תיצור מתכון בעזרת בינה מלאכותית",
        quantitySelector: "מנות",
        labelGenerate: "מה בא לך להכין?",
        requiredTitle: "נדרשת כותרת",
        go: "למתכון",
        excludeIngredient: "הסר רכיבים שאת/ה לא רוצה",
        loadingWithImage: "...מייצר תמונה",
        loadingWithImageLowerMessage: "זה יקח דקה",
        loadingNoImage: "...מייצר מתכון",
      },
likeScreen:{
  likedTitle:"מועדפים"
},
      filters: {
        image: {
           image:"תמונה",
          withImage: "עם",
          noImage: "ללא",
        },
        sugar: {
          regular: "סוכר רגיל",
          low: "דל סוכר",
          none: "ללא סוכר",
        },
        lactose: {
          regular: "חלב רגיל",
          none: "ללא לקטוז",
        },
        gluten: {
          regular: "גלוטן רגיל",
          none: "ללא גלוטן",
        },
        diet: {
          none: "רגיל",
          vegan: "טבעוני",
          kosher: "כשר"
        },
      },

      auth: {
        login: {
          title: "התחברות",
          emailLabel: "הכנס אימייל",
          emailPlaceholder: "אימייל",
          passwordLabel: "הכנס סיסמה",
          passwordPlaceholder: "סיסמה",
          submit: "התחבר",
          registerLink: "הרשמה",
          hidePassword: "הסתר סיסמה",
          showPassword: "הצג סיסמה",
        },

        registration: {
          title: "הרשמה",
          back: "חזרה",
          firstNameLabel: "שם פרטי",
          firstNamePlaceholder: "שם פרטי",
          lastNameLabel: "שם משפחה",
          lastNamePlaceholder: "שם משפחה",
          emailLabel: "הכנס אימייל",
          emailPlaceholder: "אימייל",
          passwordLabel: "הכנס סיסמה",
          passwordPlaceholder: "סיסמה",
          birthDateLabel: "תאריך לידה",
          phoneLabel: "הכנס מספר טלפון",
          phonePlaceholder: "מספר טלפון",
          male: "זכר",
          female: "נקבה",
          other: "אחר",
          submit: "הרשם",
          firstNameRequired: "נדרש שם פרטי",
          lastNameRequired: "נדרש שם משפחה",
          min3Chars: "נדרשים לפחות 3 תווים",
          emailRequired: "נדרש אימייל",
          emailInvalid: "הכנס אימייל תקין",
          passwordRequired: "נדרשת סיסמה",
          passwordMin8: "לפחות 8 תווים",
          birthDateRequired: "נדרש תאריך לידה",
          birthDateFuture: "תאריך הלידה לא יכול להיות בעתיד",
          minAge12: "המשתמש חייב להיות לפחות בן 12 כדי להירשם",
          phoneRequired: "נדרש מספר טלפון",
        },
      },

      profile: {
        title: "פרופיל",
        edit: "עריכה",
        updateFirstName: "עדכן שם פרטי",
        updateLastName: "עדכן שם משפחה",
        updateEmail: "עדכן אימייל",
        updatePhone: "עדכן מספר טלפון",
        updateProfile: "עדכן פרופיל",
        emailPrefix: "אימייל:",
        phonePrefix: "מספר טלפון:",
        birthDatePrefix: "תאריך לידה:",
        userUpdated: "המשתמש עודכן",
        imageUpdated: "תמונת הפרופיל עודכנה",
      },

      recipeUi: {
        share: "שיתוף",
        instructions: "הוראות הכנה",
        ingredients: "מצרכים",
        loadImage: "טען תמונה",
        clear: "נקה",
        showRecipe: "הצג מתכון",
        back: "חזרה",
        infoTitle: "מידע",
        calories: "קלוריות",
        sugar: "סוכר",
        protein: "חלבון",
        health: "בריאות",
        kcal: 'קק"ל',
      },
      difficulty: {
        easy: "קל",
        midLevel: "בינוני",
        hard: "קשה",
      },
      units: {
        gramShort: "ג",
        tbspShort: "כפיות",
        per100g: "|ג 100",
        minuteShort: "דק׳",
      },

      notify: {
        genericError: "אירעה שגיאה, נסה שוב",
      },
    },
  },
};


const stored = localStorage.getItem("selectedLanguage");
const lng = stored === "he" || stored === "en" ? stored : "en";

i18n.use(initReactI18next).init({
  resources,
  lng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;