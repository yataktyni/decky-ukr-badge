# UA Localization Badge Plugin for Steam Deck Decky Loader

[![Create Release](https://github.com/yataktyni/decky-ua-localization-badge/actions/workflows/release.yml/badge.svg)](https://github.com/yataktyni/decky-ua-localization-badge/actions/workflows/release.yml)

Adds a badge to Steam game pages showing Ukrainian localization availability.  
Додає бейдж на сторінки ігор у Steam, що показує наявність української локалізації:

- 🫡 Official (Steam) / Офіційна (Steam)
- 🫂 Community (kuli.com.ua) / Спільнотна (kuli.com.ua)
- ❌ None / Відсутня

## Features
- Configurable badge style, position, and size  
  Налаштовувані стиль, позиція та розмір бейджа
- Daily cache with manual clear option  
  Щоденне кешування з можливістю ручного очищення
- UI in English and Ukrainian  
  Інтерфейс англійською та українською

## Installation / Встановлення

### Using Decky Loader's "Install from URL" (Recommended for users) / Використання "Встановити з URL" у Decky Loader (рекомендовано для користувачів)

1.  Open **Decky Loader** on your Steam Deck.  
    Відкрийте **Decky Loader** на своєму Steam Deck.
2.  Go to the **Plugin Loader** tab.  
    Перейдіть на вкладку **Plugin Loader**.
3.  Click the **gear icon ⚙️** in the top right.  
    Натисніть **значок ⚙️** у верхньому правому куті.
4.  Choose **"Install from URL"**.  
    Виберіть **"Встановити з URL"**.
5.  Paste the following URL to the latest `release.zip`:
    Вставте наступний URL-адресу останнього `release.zip`:
    ```
    https://github.com/yataktyni/decky-ua-localization-badge/releases/latest/download/release.zip
    ```
6.  Click **Install**.  
    Натисніть **Встановити**.
7.  Done! The plugin should now appear in your Decky menu.  
    Готово! Плагін має з'явитися в меню Decky.

### Decky Loader Store : coming soon

### Building from Source (For developers) / Збірка з вихідного коду (для розробників)

1.  **Clone the repository:**  
    **Клонуйте репозиторій:**
    ```bash
    git clone https://github.com/yataktyni/decky-ukr-badge.git
    cd decky-ukr-badge
    ```
2.  **Install dependencies:**  
    **Встановіть залежності:**
    ```bash
    pnpm install
    # or
    npm install
    ```
3.  **Build the plugin:**  
    **Зберіть плагін:**
    ```bash
    pnpm build
    # or
    npm run build
    ```
4.  The built plugin will be located in the `dist/` directory as `index.js`.  
    Зібраний плагін буде знаходитися в каталозі `dist/` як `index.js`.
5.  **For manual testing:** Copy the entire plugin folder (containing `plugin.json`, `package.json`, `main.py`, `dist/`, `src/`, `LICENSE`, etc.) to `/home/deck/homebrew/plugins/` on your Steam Deck.  
    **Для ручного тестування:** Скопіюйте всю папку плагіна (що містить `plugin.json`, `package.json`, `main.py`, `dist/`, `src/`, `LICENSE` тощо) до `/home/deck/homebrew/plugins/` на вашому Steam Deck.

### Manual Installation (Advanced users) / Ручне встановлення (для досвідчених користувачів)

1.  Go to the [Releases page](https://github.com/yataktyni/decky-ua-localization-badge/releases).
    Перейдіть на сторінку [Релізів](https://github.com/yataktyni/decky-ua-localization-badge/releases).
2.  Download the `release.zip` from the latest release.
    Завантажте файл `release.zip` з останнього релізу.
3.  Extract the `decky-ua-localization-badge` folder from the `release.zip`.
    Розпакуйте папку `decky-ua-localization-badge` з архіву `release.zip`.
4.  Copy the extracted `decky-ua-localization-badge` folder to `/home/deck/homebrew/plugins/` on your Steam Deck.
    Скопіюйте розпаковану папку `decky-ua-localization-badge` до `/home/deck/homebrew/plugins/` на вашому Steam Deck.

## License
MIT

## Links
- [Support on Ko-fi ❤️](https://ko-fi.com/YOUR_KOFI_NAME)
- [Other Projects](https://github.com/yataktyni)
- [Kuli (Community Translations)](https://kuli.com.ua/)