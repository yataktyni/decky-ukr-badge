// decky-ukr-badge/settings.tsx
import React, { useEffect, useState } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, DropdownItem, SliderField, ServerAPI } from "decky-frontend-lib";
import { t } from "./translations";

export const DEFAULT_SETTINGS = {
    badgeType: "full",
    badgePosition: "top-right",
    offsetX: 10,
    offsetY: 10,
};

type SettingsType = typeof DEFAULT_SETTINGS;

type SettingsProps = {
    serverAPI: ServerAPI;
};

export function Settings({ serverAPI }: SettingsProps) {
    const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        serverAPI.callPluginMethod("get_settings", {}).then((resp: any) => {
            if (resp.success && resp.result) {
                setSettings({ ...DEFAULT_SETTINGS, ...resp.result });
            }
            setLoading(false);
        });
    }, []);

    const updateSetting = (key: keyof SettingsType, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        serverAPI.callPluginMethod("set_settings", { settings: newSettings });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <PanelSection title={t("settings_title")}>
            <PanelSectionRow>
                <DropdownItem
                    label={t("badge_type")}
                    description={t("badge_type_caption")}
                    rgOptions={[
                        { label: t("type_default"), data: "default" },
                        { label: t("type_full"), data: "full" },
                    ]}
                    selectedOption={settings.badgeType}
                    onChange={(data: any) => updateSetting("badgeType", data.data)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <DropdownItem
                    label={t("badge_position")}
                    description={t("badge_position_caption")}
                    rgOptions={[
                        { label: t("top_left"), data: "top-left" },
                        { label: t("top_right"), data: "top-right" },
                    ]}
                    selectedOption={settings.badgePosition}
                    onChange={(data: any) => updateSetting("badgePosition", data.data)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <SliderField
                    label="X Offset"
                    value={settings.offsetX}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(value: number) => updateSetting("offsetX", value)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <SliderField
                    label="Y Offset"
                    value={settings.offsetY}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(value: number) => updateSetting("offsetY", value)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => serverAPI.callPluginMethod("clear_cache", {})} label={t("clear_cache")} />
            </PanelSectionRow>
            <PanelSectionRow>
                <a href="https://ko-fi.com/YOUR_KOFI_NAME" target="_blank">
                    ❤️ Ko-fi
                </a>
            </PanelSectionRow>
            <PanelSectionRow>
                <a href="https://github.com/yataktyni/decky-ukr-badge" target="_blank">
                    📦 GitHub
                </a>
            </PanelSectionRow>
        </PanelSection>
    );
}
