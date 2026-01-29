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
- **📖 Корисні посилання** — швидкий доступ до відеоінструкцій та посібників Steam.

### ⚙️ Налаштування

- **Тип значка**: вибір між лише іконкою або іконкою з текстом ("Офіційна локалізація"/"Переклад  від спільноти").
- **Позиція**: можливість вибору кута (вгорі зліва/справа) з автоматичним уникненням накладання на Badge від ProtonDB.
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
- 📦 [GitHub](https://github.com/yataktyni/decky-ukr-badge)
- 🎈 [Kuli — каталог української локалізації ігор](https://kuli.com.ua/)

---
---

## 🇬🇧 English

A **Decky Loader** plugin for Steam Deck that adds a Ukrainian localization badge to game pages in your Library and Steam Store.

### ✨ Features

- **✅ Official** — the game has official Ukrainian language support on Steam.
- **🤝 Community** — translations provided by the community via [kuli.com.ua](https://kuli.com.ua/).
- **❌ None** — no Ukrainian localization found for this game yet.
- **🛒 Store Overlay** — the badge automatically appears on Steam Store pages.
- **📖 Useful Links** — quick access to video guides and Steam Community guides.

### ⚙️ Settings

- **Badge Type**: switch between "Icon Only" or "Icon + Text" (Official/Community).
- **Position**: choose between top-left/top-right with automatic ProtonDB badge avoidance.
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
- 📦 [GitHub](https://github.com/yataktyni/decky-ukr-badge)
- 🎈 [Kuli — Сatalog of Ukrainian game translations](https://kuli.com.ua/)

---

## 📄 License

This project is licensed under the [GNU Lesser General Public License v3.0](LICENSE).
