// decky-ukr-badge/src/translations.ts

type TranslationDict = Record<string, string>;

const translations: Record<string, TranslationDict> = {
  en: {
    plugin_description:
      "A Decky Loader plugin for Steam Deck that displays a badge indicating Ukrainian language support in games.",
    ukrainian: "Ukrainian",
    settings_title: "Ukrainian localization badge settings",
    badge_type: "Badge Type",
    type_default: "Icon Only",
    type_full: "Icon + Text",
    badge_position: "Badge Position",
    top_left: "Top Left",
    top_right: "Top Right",
    official: "Official",
    community: "Community",
    none: "None",
    links: "Links",
    donate: "Donate",
    show_qr_code: "Show QR Code",
    usdt_support: "USDT (TRC20)",
    support_on_kofi: "Support on Ko-fi",
    kuli_website: "Kuli.com.ua",
    github_source: "GitHub Source",
    show_on_store: "Show on Store Page",
    store_x_offset: "Store X Offset",
    store_y_offset: "Store Y Offset",
    x_offset: "X Offset",
    y_offset: "Y Offset",
    video_guide: "Video Guide",
    text_guide: "Guide",
    default: "Default",
    version: "Version",
    author_x: "Message Me",
    update_plugin: "Update Plugin",
    updating: "Updating...",
    update_success: "Updated successfully!",
    update_error: "Update failed",
    current_version: "Current version",
    update_to: "Update to",
    version_check_failed: "version check failed",
    already_up_to_date: "Already up to date",
    restart_to_apply: "Restart Decky to apply",
  },
  uk: {
    plugin_description:
      "Плагін Decky Loader для Steam Deck, що показує бейдж локалізації українською для ігор.",
    ukrainian: "Українська",
    settings_title: "Налаштування бейджа української локалізації",
    badge_type: "Тип бейджа",
    type_default: "Лише іконка",
    type_full: "Іконка + Текст",
    badge_position: "Позиція бейджа",
    top_left: "Вгорі зліва",
    top_right: "Вгорі справа",
    official: "Офіційна",
    community: "Спільнота",
    none: "Відсутня",
    links: "Посилання",
    donate: "Донат",
    show_qr_code: "Показати QR-код",
    usdt_support: "USDT (TRC20)",
    support_on_kofi: "Підтримати на Ko-fi",
    kuli_website: "Kuli.com.ua",
    github_source: "Код на GitHub",
    show_on_store: "Показувати в магазині",
    store_x_offset: "Зміщення X в магазині",
    store_y_offset: "Зміщення Y в магазині",
    x_offset: "Зміщення X",
    y_offset: "Зміщення Y",
    video_guide: "Відеопосібник",
    text_guide: "Посібник",
    default: "За замовчуванням",
    version: "Версія",
    author_x: "Написати мені",
    update_plugin: "Оновити плагін",
    updating: "Оновлюється...",
    update_success: "Успішно оновлено!",
    update_error: "Помилка оновлення",
    current_version: "Поточна версія",
    update_to: "Оновити до",
    version_check_failed: "помилка перевірки версії",
    already_up_to_date: "Вже оновлено",
    restart_to_apply: "Перезапустіть Decky для застосування",
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
