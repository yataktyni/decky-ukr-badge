// decky-ukr-badge/src/settings.tsx
import React, { FC, useEffect, useState } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  DropdownItem,
  SliderField,
} from "@decky/ui";
import { call } from "@decky/api";
import { t, getSupportedLanguage } from "./translations";

export const DEFAULT_SETTINGS = {
  badgeType: "full" as "full" | "default",
  badgePosition: "top-right" as "top-left" | "top-right",
  offsetX: 10,
  offsetY: 10,
};

export type SettingsType = typeof DEFAULT_SETTINGS;

const CACHE_KEY = "decky-ukr-badge-cache";

interface SettingsProps {
  serverAPI: typeof call;
}

export const Settings: FC<SettingsProps> = ({ serverAPI }) => {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  const lang = getSupportedLanguage();

  useEffect(() => {
    (serverAPI("get_settings") as Promise<SettingsType>)
      .then((resp: SettingsType) => {
        setSettings({ ...DEFAULT_SETTINGS, ...resp });
        setLoading(false);
      })
      .catch((e: unknown) => {
        console.error("[decky-ukr-badge] Failed to load settings:", e);
        setLoading(false);
      });
  }, [serverAPI]);

  const updateSetting = <K extends keyof SettingsType>(
    key: K,
    value: SettingsType[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    serverAPI("set_settings", { key, value }).catch((e: unknown) => {
      console.error("[decky-ukr-badge] Failed to save setting:", e);
    });
  };

  const handleClearCache = () => {
    try {
      // Clear localStorage cache
      localStorage.removeItem(CACHE_KEY);

      // Also call backend to clear any server-side cache
      serverAPI("clear_cache")
        .then(() => {
          setCacheCleared(true);
          setTimeout(() => setCacheCleared(false), 2000);
        })
        .catch((e: unknown) => {
          console.error("[decky-ukr-badge] Failed to clear backend cache:", e);
          // Still show success since localStorage was cleared
          setCacheCleared(true);
          setTimeout(() => setCacheCleared(false), 2000);
        });
    } catch (e) {
      console.error("[decky-ukr-badge] Failed to clear cache:", e);
    }
  };

  if (loading) {
    return (
      <PanelSection>
        <PanelSectionRow>
          <div>Loading...</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title={t("settings_title", lang)}>
      <PanelSectionRow>
        <DropdownItem
          label={t("badge_type", lang)}
          description={t("badge_type_caption", lang)}
          rgOptions={[
            { label: t("type_default", lang), data: "default" },
            { label: t("type_full", lang), data: "full" },
          ]}
          selectedOption={settings.badgeType}
          onChange={(option: { data: "full" | "default" }) =>
            updateSetting("badgeType", option.data)
          }
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <DropdownItem
          label={t("badge_position", lang)}
          description={t("badge_position_caption", lang)}
          rgOptions={[
            { label: t("top_left", lang), data: "top-left" },
            { label: t("top_right", lang), data: "top-right" },
          ]}
          selectedOption={settings.badgePosition}
          onChange={(option: { data: "top-left" | "top-right" }) =>
            updateSetting("badgePosition", option.data)
          }
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label="X Offset"
          value={settings.offsetX}
          min={0}
          max={100}
          step={5}
          onChange={(value: number) => updateSetting("offsetX", value)}
          showValue
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label="Y Offset"
          value={settings.offsetY}
          min={0}
          max={100}
          step={5}
          onChange={(value: number) => updateSetting("offsetY", value)}
          showValue
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={handleClearCache}
          disabled={cacheCleared}
        >
          {cacheCleared
            ? "✓ " + t("clear_cache", lang)
            : t("clear_cache", lang)}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "8px 0",
          }}
        >
          <a
            href="https://ko-fi.com/yataktyni"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#dcdedf",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ❤️ Support on Ko-fi
          </a>
          <a
            href="https://github.com/yataktyni/decky-ukr-badge"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#dcdedf",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📦 GitHub
          </a>
          <a
            href="https://kuli.com.ua/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#dcdedf",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🇺🇦 Kuli.com.ua
          </a>
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
};
