import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import fr from "./locales/fr.json";
import ru from "./locales/ru.json";
import ja from "./locales/ja.json";
import vi from "./locales/vi.json";

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  fr: { translation: fr },
  ru: { translation: ru },
  ja: { translation: ja },
  vi: { translation: vi },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    // Always init with the fallback so the server render and the first client
    // render agree. The persisted/detected language is applied after mount via
    // I18nLanguageProvider to avoid a hydration mismatch. Setting `lng`
    // explicitly skips LanguageDetector at init; it is still used to cache
    // language changes to localStorage.
    lng: "en",
    load: "languageOnly",
    interpolation: { escapeValue: false },
    nsSeparator: false,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
