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

// Helper function to call backend with timeout
export async function callBackend<T>(
    method: string,
    args: Record<string, unknown> = {},
    timeoutMs: number = 5000,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(
                new Error(
                    `Backend call '${method}' timed out after ${timeoutMs}ms`,
                ),
            );
        }, timeoutMs);

        call<[Record<string, unknown>], T>(method, args)
            .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

export const Settings: FC = () => {
    const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cacheCleared, setCacheCleared] = useState(false);

    const lang = getSupportedLanguage();

    useEffect(() => {
        let mounted = true;

        async function fetchSettings() {
            try {
                console.log(
                    "[decky-ukr-badge] Fetching settings from backend...",
                );
                const resp = await callBackend<SettingsType>(
                    "get_settings",
                    {},
                    5000,
                );
                console.log("[decky-ukr-badge] Got settings:", resp);

                if (mounted) {
                    if (resp && typeof resp === "object") {
                        setSettings({ ...DEFAULT_SETTINGS, ...resp });
                    }
                    setError(null);
                    setLoading(false);
                }
            } catch (e: unknown) {
                console.error("[decky-ukr-badge] Failed to load settings:", e);
                if (mounted) {
                    // Use default settings on error, but still show the UI
                    setSettings(DEFAULT_SETTINGS);
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Failed to connect to backend",
                    );
                    setLoading(false);
                }
            }
        }

        fetchSettings();

        return () => {
            mounted = false;
        };
    }, []);

    const updateSetting = async <K extends keyof SettingsType>(
        key: K,
        value: SettingsType[K],
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await callBackend<boolean>("set_settings", { key, value }, 3000);
            console.log(`[decky-ukr-badge] Saved setting: ${key} = ${value}`);
        } catch (e: unknown) {
            console.error("[decky-ukr-badge] Failed to save setting:", e);
        }
    };

    const handleClearCache = async () => {
        try {
            // Clear localStorage cache
            localStorage.removeItem(CACHE_KEY);
            console.log("[decky-ukr-badge] Cleared localStorage cache");

            // Also call backend to clear any server-side cache
            try {
                await callBackend<boolean>("clear_cache", {}, 3000);
            } catch (e) {
                console.warn(
                    "[decky-ukr-badge] Backend clear_cache failed (non-critical):",
                    e,
                );
            }

            setCacheCleared(true);
            setTimeout(() => setCacheCleared(false), 2000);
        } catch (e) {
            console.error("[decky-ukr-badge] Failed to clear cache:", e);
        }
    };

    if (loading) {
        return (
            <PanelSection title={t("settings_title", lang)}>
                <PanelSectionRow>
                    <div style={{ padding: "10px 0" }}>Loading settings...</div>
                </PanelSectionRow>
            </PanelSection>
        );
    }

    return (
        <PanelSection title={t("settings_title", lang)}>
            {error && (
                <PanelSectionRow>
                    <div
                        style={{
                            color: "#ffaa00",
                            fontSize: "12px",
                            padding: "8px",
                            backgroundColor: "rgba(255, 170, 0, 0.1)",
                            borderRadius: "4px",
                            marginBottom: "8px",
                        }}
                    >
                        ⚠️ {error} (using defaults)
                    </div>
                </PanelSectionRow>
            )}

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
                    onChange={(value: number) =>
                        updateSetting("offsetX", value)
                    }
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
                    onChange={(value: number) =>
                        updateSetting("offsetY", value)
                    }
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
