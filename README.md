# 🇺🇦 decky-ukr-badge

[![Latest Release](https://img.shields.io/github/v/release/yataktyni/decky-ukr-badge?label=latest%20release&color=green)](https://github.com/yataktyni/decky-ukr-badge/releases/latest)
[![License](https://img.shields.io/github/license/yataktyni/decky-ukr-badge)](LICENSE)

---

## 🇺🇦 Українська

Плагін для **Decky Loader** на Steam Deck, який показує значок з інформацією про підтримку української мови в іграх.

### ✨ Можливості

- **🫡 Офіційна локалізація** — гра має українську мову в Steam
- **🫂 Спільнотний переклад** — переклад доступний на [kuli.com.ua](https://kuli.com.ua/)
- **❌ Відсутня** — українська локалізація недоступна

### ⚙️ Налаштування

- Тип значка (лише іконка / іконка + текст)
- Позиція значка (вгорі зліва / вгорі справа)
- Зміщення по X та Y
- Очищення кешу

---

### 📥 Встановлення

#### Спосіб 1: Через меню Decky Loader (рекомендовано)

1. Завантажте файл `release.zip` з [останнього релізу](https://github.com/yataktyni/decky-ukr-badge/releases/latest)
2. На Steam Deck відкрийте **Decky Loader** (кнопка `...`)
3. Перейдіть до ⚙️ **Налаштування** → **Developer**
4. Виберіть **Install Plugin From File**
5. Знайдіть та виберіть завантажений `release.zip`
6. Перезавантажте Decky Loader

#### Спосіб 2: Ручне встановлення

1. Завантажте `release.zip` з [релізів](https://github.com/yataktyni/decky-ukr-badge/releases/latest)
2. Розпакуйте архів
3. Скопіюйте папку `decky-ukr-badge` до:
   ```
   /home/deck/homebrew/plugins/
   ```
4. Перезавантажте Decky Loader або Steam Deck

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
# або: npm install

# Зберіть плагін
pnpm build
# або: npm run build
```

Після збірки файл `dist/index.js` буде створено.

**Для тестування на Steam Deck:**

Скопіюйте ці файли/папки на Steam Deck до `/home/deck/homebrew/plugins/decky-ukr-badge/`:
- `dist/`
- `main.py`
- `plugin.json`
- `package.json`
- `LICENSE`
- `README.md`

---

### 🔗 Посилання

- ❤️ [Підтримати на Ko-fi](https://ko-fi.com/yataktyni)
- 📦 [GitHub](https://github.com/yataktyni/decky-ukr-badge)
- 🇺🇦 [Kuli — спільнотні переклади](https://kuli.com.ua/)

---
---

## 🇬🇧 English

A **Decky Loader** plugin for Steam Deck that displays a badge showing Ukrainian language support in games.

### ✨ Features

- **🫡 Official localization** — game has Ukrainian language on Steam
- **🫂 Community translation** — translation available on [kuli.com.ua](https://kuli.com.ua/)
- **❌ None** — no Ukrainian localization available

### ⚙️ Settings

- Badge type (icon only / icon + text)
- Badge position (top-left / top-right)
- X and Y offset
- Clear cache

---

### 📥 Installation

#### Method 1: Via Decky Loader Menu (Recommended)

1. Download `release.zip` from the [latest release](https://github.com/yataktyni/decky-ukr-badge/releases/latest)
2. On your Steam Deck, open **Decky Loader** (press `...` button)
3. Go to ⚙️ **Settings** → **Developer**
4. Select **Install Plugin From File**
5. Find and select the downloaded `release.zip`
6. Restart Decky Loader

#### Method 2: Manual Installation

1. Download `release.zip` from [releases](https://github.com/yataktyni/decky-ukr-badge/releases/latest)
2. Extract the archive
3. Copy the `decky-ukr-badge` folder to:
   ```
   /home/deck/homebrew/plugins/
   ```
4. Restart Decky Loader or your Steam Deck

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
# or: npm install

# Build the plugin
pnpm build
# or: npm run build
```

After building, `dist/index.js` will be created.

**To test on Steam Deck:**

Copy these files/folders to your Steam Deck at `/home/deck/homebrew/plugins/decky-ukr-badge/`:
- `dist/`
- `main.py`
- `plugin.json`
- `package.json`
- `LICENSE`
- `README.md`

---

### 🔗 Links

- ❤️ [Support on Ko-fi](https://ko-fi.com/yataktyni)
- 📦 [GitHub](https://github.com/yataktyni/decky-ukr-badge)
- 🇺🇦 [Kuli — Community Translations](https://kuli.com.ua/)

---

## 📄 License

[BSD-3-Clause](LICENSE)