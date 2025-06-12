// decky-ukr-badge/translations.ts
const translations = {
    en: {
        plugin_description: "Shows Ukrainian localization badge for Steam games.",
        ukrainian: "Ukrainian",
        settings_title: "UA Badge Settings",
        badge_type: "Badge Type",
        badge_type_caption: "Choose how the badge looks",
        type_default: "Icon Only",
        type_full: "Icon + Caption",
        badge_position: "Badge Position",
        badge_position_caption: "Choose where the badge appears",
        top_left: "Top Left",
        top_right: "Top Right",
        clear_cache: "Clear Badge Info Cache",
    },
    uk: {
        plugin_description: "Показує значок локалізації українською для ігор Steam.",
        ukrainian: "Українська",
        settings_title: "Налаштування значка UA",
        badge_type: "Тип значка",
        badge_type_caption: "Виберіть, як виглядатиме значок",
        type_default: "Лише іконка",
        type_full: "Іконка + Текст",
        badge_position: "Позиція значка",
        badge_position_caption: "Виберіть, де з’явиться значок",
        top_left: "Вгорі зліва",
        top_right: "Вгорі справа",
        clear_cache: "Очистити кеш значків",
    },
};

export function t(key: string): string {
    const lang = navigator.language.startsWith("uk") ? "uk" : "en";
    return translations[lang]?.[key] || translations["en"][key] || key;
}
