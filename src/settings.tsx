// decky-ukr-badge/settings.tsx
import React, { useEffect, useState } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, DropdownItem, SliderField } from "@decky/ui";
import { call } from "@decky/api";
import { t } from "./translations";

export const DEFAULT_SETTINGS = {
    badgeType: "full",
    badgePosition: "top-right",
    offsetX: 10,
    offsetY: 10,
};

type SettingsType = typeof DEFAULT_SETTINGS;

type SettingsProps = {
    serverAPI: typeof call;
};

export function Settings({ serverAPI }: SettingsProps) {
    const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        serverAPI("get_settings", {}).then((resp: any) => {
            if (resp.success && resp.result) {
                setSettings({ ...DEFAULT_SETTINGS, ...resp.result });
            }
            setLoading(false);
        });
    }, []);

    const updateSetting = (key: keyof SettingsType, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        serverAPI("set_settings", { key: key, value: value });
    };

    if (loading) return React.createElement("div", null, "Loading...");

    return (
        React.createElement(PanelSection, { title: t("settings_title") },
            React.createElement(PanelSectionRow, null,
                React.createElement(DropdownItem, {
                    label: t("badge_type"),
                    description: t("badge_type_caption"),
                    rgOptions: [
                        { label: t("type_default"), data: "default" },
                        { label: t("type_full"), data: "full" },
                    ],
                    selectedOption: settings.badgeType,
                    onChange: (data: any) => updateSetting("badgeType", data.data)
                })
            ),
            React.createElement(PanelSectionRow, null,
                React.createElement(DropdownItem, {
                    label: t("badge_position"),
                    description: t("badge_position_caption"),
                    rgOptions: [
                        { label: t("top_left"), data: "top-left" },
                        { label: t("top_right"), data: "top-right" },
                    ],
                    selectedOption: settings.badgePosition,
                    onChange: (data: any) => updateSetting("badgePosition", data.data)
                })
            ),
            React.createElement(PanelSectionRow, null,
                React.createElement(SliderField, {
                    label: "X Offset",
                    value: settings.offsetX,
                    min: 0,
                    max: 100,
                    step: 1,
                    onChange: (value: number) => updateSetting("offsetX", value)
                })
            ),
            React.createElement(PanelSectionRow, null,
                React.createElement(SliderField, {
                    label: "Y Offset",
                    value: settings.offsetY,
                    min: 0,
                    max: 100,
                    step: 1,
                    onChange: (value: number) => updateSetting("offsetY", value)
                })
            ),
            React.createElement(PanelSectionRow, null,
                React.createElement(ButtonItem, { layout: "below", onClick: () => serverAPI("clear_cache", {}), label: t("clear_cache") })
            ),
            React.createElement(PanelSectionRow, null,
                React.createElement("a", { href: "https://ko-fi.com/YOUR_KOFI_NAME", target: "_blank" },
                    "❤️ Ko-fi"
                )
            ),
            React.createElement(PanelSectionRow, null,
                React.createElement("a", { href: "https://github.com/yataktyni/decky-ukr-badge", target: "_blank" },
                    "📦 GitHub"
                )
            )
        )
    );
}
