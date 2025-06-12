# UA Localization Badge Plugin for Steam Deck Decky Loader

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

## Project Structure
```
your-plugin/
├── assets/           # (optional) images and other resources
├── defaults/         # (optional) plain-text configs and templates
├── main.py           # (optional) Backend Python code for settings and cache
├── plugin.json       # [required] Plugin metadata
├── package.json      # [required] npm/pnpm metadata
├── README.md         # This file
├── LICENSE           # [required] License file
├── src/              # [required] Frontend TypeScript code
│   ├── index.tsx     # Main entry point
│   ├── settings.tsx  # Settings component
│   ├── translations.ts # Localization strings
│   └── utils.ts      # Utility functions
├── dist/             # [required] Build output directory
│   └── index.js      # Built JavaScript plugin
└── tsconfig.json     # TypeScript configuration
```

## Installation

### Using Decky Loader's "Install from URL" (Recommended for users)

1.  Open **Decky Loader** on your Steam Deck.
2.  Go to the **Plugin Loader** tab.
3.  Click the **gear icon ⚙️** in the top right.
4.  Choose **"Install from URL"**.
5.  Paste the following GitHub repository URL:
    ```
    https://github.com/yataktyni/decky-ukr-badge
    ```
6.  Click **Install**.
7.  Done! The plugin should now appear in your Decky menu.

### Building from Source (For developers)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yataktyni/decky-ukr-badge.git
    cd decky-ukr-badge
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

## License
MIT

## Links
- [Support on Ko-fi ❤️](https://ko-fi.com/YOUR_KOFI_NAME)
- [Other Projects](https://github.com/yataktyni)
- [Kuli (Community Translations)](https://kuli.com.ua/)