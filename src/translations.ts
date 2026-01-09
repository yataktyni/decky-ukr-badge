// decky-ukr-badge/src/translations.ts

type TranslationDict = Record<string, string>;

const translations: Record<string, TranslationDict> = {
  en: {
    plugin_description:
      "A Decky Loader plugin for Steam Deck that displays a badge indicating Ukrainian language support in games.",
    ukrainian: "Ukrainian",
    settings_title: "Ukrainian Badge Settings",
    badge_type: "Badge Type",
    badge_type_caption: "Choose the badge display type.",
    type_default: "Icon Only",
    type_full: "Icon + Text",
    badge_position: "Badge Position",
    badge_position_caption: "Choose where the badge appears.",
    top_left: "Top Left",
    top_right: "Top Right",
    clear_cache: "Clear Cache",
    official: "Official",
    community: "Community",
    none: "None",
  },
  uk: {
    plugin_description:
      "Плагін Decky Loader для Steam Deck, що показує значок локалізації українською для ігор.",
    ukrainian: "Українська",
    settings_title: "Налаштування значка UA",
    badge_type: "Тип значка",
    badge_type_caption: "Виберіть, як виглядатиме значок.",
    type_default: "Лише іконка",
    type_full: "Іконка + Текст",
    badge_position: "Позиція значка",
    badge_position_caption: "Виберіть, де з'явиться значок.",
    top_left: "Вгорі зліва",
    top_right: "Вгорі справа",
    clear_cache: "Очистити кеш",
    official: "Офіційна",
    community: "Спільнотна",
    none: "Відсутня",
  },
};

/**
 * Determines the supported language based on the browser/Steam client settings.
 * Returns 'uk' for Ukrainian, 'en' for everything else.
 */
export function getSupportedLanguage(): "en" | "uk" {
  try {
    const browserLang = navigator.language?.toLowerCase() || "";

    // Check for Ukrainian
    if (browserLang.startsWith("uk")) {
      return "uk";
    }

    return "en";
  } catch {
    return "en";
  }
}

/**
 * Translates a key to the specified language.
 * Falls back to English if the translation is not found.
 *
 * @param key - The translation key
 * @param lang - The language code ('en' or 'uk'). Defaults to 'en'.
 * @returns The translated string, or the key itself if not found.
 */
export function t(key: string, lang: string = "en"): string {
  // Normalize language code
  const normalizedLang = lang.toLowerCase().startsWith("uk") ? "uk" : "en";

  // Try to get translation in requested language
  const translation = translations[normalizedLang]?.[key];

  if (translation) {
    return translation;
  }

  // Fallback to English
  const fallback = translations["en"]?.[key];

  if (fallback) {
    return fallback;
  }

  // Return the key itself as last resort
  return key;
}
