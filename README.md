# <img src="https://flagcdn.com/48x36/ua.png" width="24" height="18" alt="UA" /> decky-ukr-badge

[![Latest Release](https://img.shields.io/github/v/release/yataktyni/decky-ukr-badge?label=latest%20release&color=green)](https://github.com/yataktyni/decky-ukr-badge/releases/latest)
[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](LICENSE)

---

## 🇺🇦 Українська

Плагін для **Decky Loader** на Steam Deck, який додає значок української локалізації на сторінки ігор у вашій бібліотеці та магазині.

### ✨ Можливості

- **✅ Офіційна** — гра має офіційну підтримку української мови в Steam.
- **🤝 Спільнота** — переклад доступний завдяки спільноті на [kuli.com.ua](https://kuli.com.ua/).
- **❌ Відсутня** — наразі українська локалізація для цієї гри не знайдена.
- **🛒 Відображення в магазині** — значок автоматично з'являється на сторінках Steam Store.
- **⛽ Оновлення в один клік** — оновлюйте плагін безпосередньо з налаштувань.
- **📖 Корисні посилання** — швидкий доступ до X (Twitter) автора, відеоінструкцій та посібників Steam.

### ⚙️ Налаштування

- **Тип значка**: вибір між "Лише іконка" або "Іконка + Текст" (Офіційна/Спільнота).
- **Позиція**: можливість вибору кута (Вгорі зліва/Вгорі справа) з автоматичним уникненням накладання на Badge від ProtonDB.
- **Зміщення (Offsets)**: точне налаштування координат X та Y для бібліотеки та магазину окремо.

---

### 📥 Встановлення

#### Спосіб 1: Через меню Decky Loader (рекомендовано)

1. Завантажте файл `release.zip` з [останнього релізу](https://github.com/yataktyni/decky-ukr-badge/releases/latest).
2. На Steam Deck відкрийте **Decky Loader** (кнопка `...`).
3. Перейдіть до ⚙️ **Налаштування** → **Developer**.
4. Виберіть **Install Plugin From File**.
5. Знайдіть та виберіть завантажений `release.zip`.
6. Перезавантажте Decky Loader.

#### Спосіб 2: Ручне встановлення

1. Завантажте `release.zip` з [релізів](https://github.com/yataktyni/decky-ukr-badge/releases/latest).
2. Розпакуйте архів.
3. Скопіюйте папку `decky-ukr-badge` до:

   ```
   /home/deck/homebrew/plugins/
   ```
4. Перезавантажте Decky Loader або Steam Deck.

#### Спосіб 3: Через термінал (Консоль)

1. Відкрийте Консоль (Konsole) в режимі робочого столу (Desktop Mode).
2. Вставте та виконайте команду:

   ```bash
   curl -fsSL https://bit.ly/4vDDIab | sh
   ```

#### Спосіб 4: Decky → Developer via URL

1. На Steam Deck відкрийте **Decky Loader** (кнопка `...`).
2. Перейдіть до ⚙️ **Налаштування** → **Developer**.
3. Вставте наступне посилання в поле "Install via URL":

   ```text
   https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip
   ```

---

### 🛠️ Збірка з вихідного коду (для розробників)

**Вимоги:**
- Node.js 18+
- pnpm або npm

**Кроки:**

```bash
# Клонуйте репозиторій
git clone https://github.com/yataktyni/decky-ukr-badge.git
cd decky-ukr-badge

# Встановіть залежності
pnpm install

# Зберіть плагін
pnpm build

# Створіть release.zip
pnpm zip
```

---

### 🔗 Посилання

- ❤️ [Підтримати на Ko-fi](https://ko-fi.com/yataktyni/tip)
- 💚 USDT TRC20: `TP63PYsRk3H9JypuHhqmfpwyCqBYyLBxQL`
- 🐦 [X (Twitter)](https://x.com/yataktyni)
- 📦 [Код на GitHub](https://github.com/yataktyni/decky-ukr-badge)
- 🎈 [Kuli.com.ua — каталог української локалізації ігор](https://kuli.com.ua/)

---

### 📝 Плани на майбутнє

- [ ] Розширення для браузера (Chromium) для https://store.steampowered.com
- [ ] Додаткові мови з власними локалізованими інструкціями
- [ ] Автоматичне встановлення перекладів для підтримуваних ігрових рушіїв в один клік

---
---

## 🇬🇧 English

A **Decky Loader** plugin for Steam Deck that adds a Ukrainian localization badge to game pages in your Library and Steam Store.

### ✨ Features

- **✅ Official** — the game has official Ukrainian language support on Steam.
- **🤝 Community** — translations provided by the community via [kuli.com.ua](https://kuli.com.ua/).
- **❌ None** — no Ukrainian localization found for this game yet.
- **🛒 Store Overlay** — the badge automatically appears on Steam Store pages.
- **⛽ One-Click Update** — update the plugin directly from settings.
- **📖 Useful Links** — quick access to author's X (Twitter), video guides and Steam Community guides.

### ⚙️ Settings

- **Badge Type**: switch between "Icon Only" or "Icon + Text" (Official/Community).
- **Position**: choose between "Top Left"/"Top Right" with automatic ProtonDB badge avoidance.
- **Offsets**: fine-tune X and Y coordinates for Library and Store pages separately.

---

### 📥 Installation

#### Method 1: Via Decky Loader Menu (Recommended)

1. Download `release.zip` from the [latest release](https://github.com/yataktyni/decky-ukr-badge/releases/latest).
2. On your Steam Deck, open **Decky Loader** (press `...` button).
3. Go to ⚙️ **Settings** → **Developer**.
4. Select **Install Plugin From File**.
5. Find and select the downloaded `release.zip`.
6. Restart Decky Loader.

#### Method 2: Manual Installation

1. Download `release.zip` from [releases](https://github.com/yataktyni/decky-ukr-badge/releases/latest).
2. Extract the archive.
3. Copy the `decky-ukr-badge` folder to:

   ```
   /home/deck/homebrew/plugins/
   ```
4. Restart Decky Loader or your Steam Deck.

#### Method 3: Via Terminal (Konsole)

1. Open Konsole in Desktop Mode.
2. Paste and run this command:

   ```bash
   curl -fsSL https://bit.ly/4vDDIab | sh
   ```

#### Method 4: Decky → Developer via URL

1. On your Steam Deck, open **Decky Loader** (press `...` button).
2. Go to ⚙️ **Settings** → **Developer**.
3. Paste the following link into the "Install via URL" field:

   ```text
   https://github.com/yataktyni/decky-ukr-badge/releases/latest/download/release.zip
   ```

---

### 🛠️ Building from Source (For Developers)

**Requirements:**
- Node.js 18+
- pnpm or npm

**Steps:**

```bash
# Clone the repository
git clone https://github.com/yataktyni/decky-ukr-badge.git
cd decky-ukr-badge

# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Create release.zip
pnpm zip
```

---

### 🔗 Links

- ❤️ [Support on Ko-fi](https://ko-fi.com/yataktyni/tip)
- 💚 USDT TRC20: `TP63PYsRk3H9JypuHhqmfpwyCqBYyLBxQL`
- 🐦 [X (Twitter)](https://x.com/yataktyni)
- 📦 [GitHub Source](https://github.com/yataktyni/decky-ukr-badge)
- 🎈 [Kuli.com.ua — Catalog of Ukrainian game translations](https://kuli.com.ua/)

---

### 📝 Roadmap

- [ ] Browser extension (Chromium) for https://store.steampowered.com
- [ ] Additional language badges with localized guides
- [ ] Automatic translation installer for supported game engines (one-click from URL or local file)

---

## 📄 License

This project is licensed under the [GNU Lesser General Public License v3.0](LICENSE).
