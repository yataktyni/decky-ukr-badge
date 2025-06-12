[![Latest Release: <VERSION_PLACEHOLDER>](https://github.com/yataktyni/decky-ukr-badge/actions/workflows/release.yml/badge.svg)](https://github.com/yataktyni/decky-ukr-badge/actions/workflows/release.yml)

---

# Плагін UA Localization Badge для Steam Deck Decky Loader

Додає бейдж на сторінки ігор у Steam, що показує наявність української локалізації:

- 🫡 Офіційна (Steam)
- 🫂 Спільнотна (kuli.com.ua)
- ❌ Відсутня

## Можливості
- Налаштовувані стиль, позиція та розмір бейджа
- Щоденне кешування з можливістю ручного очищення
- Інтерфейс англійською та українською

## Встановлення

### Використання "Встановити з URL" у Decky Loader (рекомендовано для користувачів)

1.  Відкрийте **Decky Loader** на своєму Steam Deck.
2.  Перейдіть на вкладку **Plugin Loader**.
3.  Натисніть **значок ⚙️** у верхньому правому куті.
4.  Виберіть **"Встановити з URL"**.
5.  Вставте наступний URL-адресу останнього `release.zip`:
    ```
    https://github.com/yataktyni/decky-ua-localization-badge/releases/latest/download/release.zip
    ```
6.  Натисніть **Встановити**.
7.  Готово! Плагін має з'явитися в меню Decky.

### Збірка з вихідного коду (для розробників)

1.  **Клонуйте репозиторій:**
    ```bash
    git clone https://github.com/yataktyni/decky-ua-localization-badge.git
    cd decky-ua-localization-badge
    ```
2.  **Встановіть залежності:**
    ```bash
    pnpm install
    # or
    npm install
    ```
3.  **Зберіть плагін:**
    ```bash
    pnpm build
    # or
    npm run build
    ```
4.  Зібраний плагін буде знаходитися в каталозі `dist/` як `index.js`.
5.  **Для ручного тестування:** Скопіюйте всю папку плагіна (що містить `plugin.json`, `package.json`, `main.py`, `dist/`, `src/`, `LICENSE` тощо) до `/home/deck/homebrew/plugins/` на вашому Steam Deck.

### Ручне встановлення (для досвідчених користувачів)

1.  Перейдіть на сторінку [Релізів](https://github.com/yataktyni/decky-ua-localization-badge/releases).
2.  Завантажте файл `release.zip` з останнього релізу.
3.  Розпакуйте папку `decky-ua-localization-badge` з архіву `release.zip`.
4.  Скопіюйте розпаковану папку `decky-ua-localization-badge` до `/home/deck/homebrew/plugins/` на вашому Steam Deck.

---

# UA Localization Badge Plugin for Steam Deck Decky Loader

Adds a badge to Steam game pages showing Ukrainian localization availability:

- 🫡 Official (Steam)
- 🫂 Community (kuli.com.ua)
- ❌ None

## Features
- Configurable badge style, position, and size
- Daily cache with manual clear option
- UI in English and Ukrainian

## Installation

### Using Decky Loader's "Install from URL" (Recommended for users)

1.  Open **Decky Loader** on your Steam Deck.
2.  Go to the **Plugin Loader** tab.
3.  Click the **gear icon ⚙️** in the top right.
4.  Choose **"Install from URL"**.
5.  Paste the following URL to the latest `release.zip`:
    ```
    https://github.com/yataktyni/decky-ua-localization-badge/releases/latest/download/release.zip
    ```
6.  Click **Install**.
7.  Done! The plugin should now appear in your Decky menu.

### Decky Loader Store : coming soon

### Building from Source (For developers)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yataktyni/decky-ua-localization-badge.git
    cd decky-ua-localization-badge
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    # or
    npm install
    ```
3.  **Build the plugin:**
    ```bash
    pnpm build
    # or
    npm run build
    ```
4.  The built plugin will be located in the `dist/` directory as `index.js`.
5.  **For manual testing:** Copy the entire plugin folder (containing `plugin.json`, `package.json`, `main.py`, `dist/`, `src/`, `LICENSE`, etc.) to `/home/deck/homebrew/plugins/` on your Steam Deck.

### Manual Installation (Advanced users)

1.  Go to the [Releases page](https://github.com/yataktyni/decky-ua-localization-badge/releases).
2.  Download the `release.zip` from the latest release.
3.  Extract the `decky-ua-localization-badge` folder from the `release.zip`.
4.  Copy the extracted `decky-ua-localization-badge` folder to `/home/deck/homebrew/plugins/` on your Steam Deck.

## License
MIT

## Links
- [Support on Ko-fi ❤️](https://ko-fi.com/yataktyni)
- [Other Projects](https://github.com/yataktyni)
- [Kuli (Community Translations)](https://kuli.com.ua/)