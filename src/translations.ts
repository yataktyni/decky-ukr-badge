// decky-ukr-badge/translations.ts
type TranslationDict = { [key: string]: string };
const translations: { [lang: string]: TranslationDict } = {
    en: {
        plugin_description: "A Decky Loader plugin for Steam Deck that displays a badge indicating Ukrainian language support in games.",
        ukrainian: "Ukrainian",
        settings_title: "Settings",
        badge_type: "Badge Type",
        badge_type_caption: "Choose the badge display type.",
        type_default: "Default",
        type_full: "Full",
        badge_position: "Badge Position",
        badge_position_caption: "Choose where the badge appears.",
        top_left: "Top Left",
        top_right: "Top Right",
        clear_cache: "Clear Cache"
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
        badge_position_caption: "Виберіть, де з'явиться значок",
        top_left: "Вгорі зліва",
        top_right: "Вгорі справа",
        clear_cache: "Очистити кеш значків",
    },
};

export function t(key: string, lang: string = "en"): string {
    return translations[lang]?.[key] || translations["en"][key] || key;
}
