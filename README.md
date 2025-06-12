# Плагін **decky-ukr-badge** для Steam Deck Decky Loader : [![Latest Release: <VERSION_PLACEHOLDER>](https://img.shields.io/badge/latest_release-<VERSION_PLACEHOLDER>-green)](https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip)

Додає бейдж на сторінки ігор у Steam, що показує наявність української локалізації:

- 🫡 Офіційна (Steam)
- 🫂 Спільнотна (kuli.com.ua)
- ❌ Відсутня

---

## Можливості
- Налаштовувані стиль, позиція та розмір бейджа
- Щоденне кешування з можливістю ручного очищення
- Інтерфейс англійською та українською

---

## Встановлення

### Збірка з вихідного коду (для розробників)

1.  **Клонуйте репозиторій:**
    ```bash
    git clone https://github.com/yataktyni/decky-ukr-badge.git
    cd decky-ukr-badge
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

### Встановлення через меню Decky Loader (для всіх користувачів)

1.  **Завантажте архів:** Завантажте файл `release.zip` з останнього [релізу](https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip).
2.  **Відкрийте Decky Loader:** На вашому Steam Deck перейдіть у `Налаштування > Decky Loader > Developer > Install Plugin From File` та виберіть завантажений `release.zip`.

### Ручне встановлення (для досвідчених користувачів)

1.  Перейдіть на сторінку [Релізів](https://github.com/yataktyni/decky-ukr-badge/releases).
2.  Завантажте файл `release.zip` з останнього релізу.
3.  Розпакуйте папку `decky-ukr-badge` з архіву `release.zip`.
4.  Скопіюйте розпаковану папку `decky-ukr-badge` до `/home/deck/homebrew/plugins/` на вашому Steam Deck.

---

## Посилання
- [Підтримка на Ko-fi ❤️](https://ko-fi.com/yataktyni)
- [Інші Проєкти](https://github.com/yataktyni)
- [Kuli (Спільнотні переклади)](https://kuli.com.ua/)

---

---

# **decky-ukr-badge** Plugin for Steam Deck Decky Loader: [![Latest Release: <VERSION_PLACEHOLDER>](https://img.shields.io/badge/latest_release-<VERSION_PLACEHOLDER>-green)](https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip)

Adds a badge to Steam game pages showing Ukrainian localization availability:

- 🫡 Official (Steam)
- 🫂 Community (kuli.com.ua)
- ❌ None

## Features
- Configurable badge style, position, and size
- Daily cache with manual clear option
- UI in English and Ukrainian

---

## Installation

### Decky Loader Store : coming soon

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

### Installation via Decky Loader Menu (For all users)

1.  **Download the archive:** Download the `release.zip` file from the latest [release](https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip).
2.  **Open Decky Loader:** On your Steam Deck, navigate to `Settings > Decky Loader > Developer > Install Plugin From File` and select the downloaded `release.zip`.

### Manual Installation (Advanced users)

1.  Go to the [Releases page](https://github.com/yataktyni/decky-ukr-badge/releases).
2.  Download the `release.zip` from the latest release.
3.  Extract the `decky-ukr-badge` folder from the `release.zip`.
4.  Copy the extracted `decky-ukr-badge` folder to `/home/deck/homebrew/plugins/` on your Steam Deck.

---

## Links
- [Support on Ko-fi ❤️](https://ko-fi.com/yataktyni)
- [Other Projects](https://github.com/yataktyni)
- [Kuli (Community Translations)](https://kuli.com.ua/)