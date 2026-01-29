// decky-ukr-badge/src/settings.tsx
import React, { FC, useState, useEffect } from "react";
import {
    PanelSection,
    PanelSectionRow,
    ButtonItem,
    DropdownItem,
    SliderField,
    ToggleField,
    Navigation,
} from "@decky/ui";
import { t, getSupportedLanguage } from "./translations";
import { useSettings, useVersionInfo } from "./hooks/useSettings";
import Spinner from "./components/Spinner";
import { LinksSection } from "./components/LinksSection";

// Declare SteamClient for TypeScript
declare const SteamClient: { System?: { OpenInSystemBrowser?: (url: string) => void } } | undefined;

const CACHE_KEY = "decky-ukr-badge-cache";

export const Settings: FC = () => {
    const {
        settings, loading, setBadgeType, setBadgePosition,
        setOffsetX, setOffsetY, setShowOnStore, setStoreOffsetX, setStoreOffsetY,
        resetSettings,
    } = useSettings();

    // Always call hook (rules of hooks)
    const { info: versionInfo, error: versionError } = useVersionInfo();

    const [offsets, setOffsets] = useState({ x: 10, y: 10, sx: 0, sy: 0 });
    const [timeouts, setTimeouts] = useState<Record<string, ReturnType<typeof setTimeout> | null>>({});

    // Sync local state with settings only when not actively dragging/debouncing
    useEffect(() => {
        setOffsets({
            x: settings.offsetX,
            y: settings.offsetY,
            sx: settings.storeOffsetX,
            sy: settings.storeOffsetY,
        });
    }, [settings.offsetX, settings.offsetY, settings.storeOffsetX, settings.storeOffsetY]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(timeouts).forEach(t => {
                if (t) clearTimeout(t);
            });
        };
    }, [timeouts]);

    const lang = getSupportedLanguage();

    const handleResetSettings = () => {
        // Clear all pending debounced updates before resetting
        Object.values(timeouts).forEach(t => {
            if (t) clearTimeout(t);
        });
        setTimeouts({});
        resetSettings();
    };

    const openUrl = (url: string) => {
        if (typeof SteamClient !== "undefined" && SteamClient.System?.OpenInSystemBrowser) {
            SteamClient.System.OpenInSystemBrowser(url);
        } else if (Navigation && typeof Navigation.NavigateToExternalWeb === "function") {
            Navigation.NavigateToExternalWeb(url);
        } else if (typeof window !== "undefined") {
            window.open(url, "_blank");
        }
    };

    const debouncedSet = (key: string, value: number, persister: (v: number) => void) => {
        setOffsets(prev => ({ ...prev, [key]: value }));
        if (timeouts[key]) clearTimeout(timeouts[key]!);
        setTimeouts(prev => ({ ...prev, [key]: setTimeout(() => persister(value), 300) }));
    };

    const typeOptions = [{ data: 0, label: t("type_default", lang), value: "default" as const }, { data: 1, label: t("type_full", lang), value: "full" as const }];
    const posOptions = [{ data: 0, label: t("top_left", lang), value: "top-left" as const }, { data: 1, label: t("top_right", lang), value: "top-right" as const }];

    return (
        <div>
            <PanelSection title={t("settings_title", lang)}>
                {loading ? (
                    <PanelSectionRow>
                        <div style={{ display: "flex", justifyContent: "center", padding: 20, width: "100%" }}>
                            <Spinner />
                        </div>
                    </PanelSectionRow>
                ) : (
                    <>
                        <PanelSectionRow>
                            <DropdownItem
                                label={t("badge_type", lang)}
                                rgOptions={typeOptions}
                                selectedOption={typeOptions.findIndex(o => o.value === settings.badgeType)}
                                onChange={(n: any) => setBadgeType(typeOptions.find(o => o.data === n.data)!.value)}
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <DropdownItem
                                label={t("badge_position", lang)}
                                rgOptions={posOptions}
                                selectedOption={posOptions.findIndex(o => o.value === settings.badgePosition)}
                                onChange={(n: any) => setBadgePosition(posOptions.find(o => o.data === n.data)!.value)}
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <ToggleField label={t("show_on_store", lang)} checked={settings.showOnStore} onChange={setShowOnStore} />
                        </PanelSectionRow>

                        {settings.showOnStore && (
                            <>
                                <PanelSectionRow><SliderField label={t("store_x_offset", lang)} value={offsets.sx} min={-200} max={200} onChange={v => debouncedSet("sx", v, setStoreOffsetX)} showValue /></PanelSectionRow>
                                <PanelSectionRow><SliderField label={t("store_y_offset", lang)} value={offsets.sy} min={-200} max={200} onChange={v => debouncedSet("sy", v, setStoreOffsetY)} showValue /></PanelSectionRow>
                            </>
                        )}

                        <PanelSectionRow><SliderField label={t("x_offset", lang)} value={offsets.x} min={0} max={300} onChange={v => debouncedSet("x", v, setOffsetX)} showValue /></PanelSectionRow>
                        <PanelSectionRow><SliderField label={t("y_offset", lang)} value={offsets.y} min={0} max={300} onChange={v => debouncedSet("y", v, setOffsetY)} showValue /></PanelSectionRow>

                        <PanelSectionRow>
                            <ButtonItem layout="below" onClick={handleResetSettings}>
                                {t("default", lang)}
                            </ButtonItem>
                        </PanelSectionRow>
                    </>
                )}
            </PanelSection>

            {!loading && (
                <>
                    <LinksSection lang={lang} openUrl={openUrl} />

                    <PanelSection title="VERSION INFO">
                        <PanelSectionRow>
                            {versionInfo ? (
                                <div style={{ padding: "4px 0", width: "100%" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px" }}>
                                        <span style={{ fontWeight: "bold" }}>{t("plugin_version", lang)}</span>
                                        <span>{versionInfo.plugin_version}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px" }}>
                                        <span style={{ fontWeight: "bold" }}>{t("steamos_version", lang)}</span>
                                        <span>{versionInfo.steamos_version}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px" }}>
                                        <span style={{ fontWeight: "bold" }}>{t("decky_version", lang)}</span>
                                        <span>{versionInfo.decky_version}</span>
                                    </div>
                                </div>
                            ) : versionError ? (
                                <div style={{ padding: "10px", textAlign: "center", color: "#ff5e5b" }}>
                                    Error loading system info
                                </div>
                            ) : (
                                <div style={{ padding: "10px", textAlign: "center", color: "#888" }}>
                                    Loading system info...
                                </div>
                            )}
                        </PanelSectionRow>
                    </PanelSection>
                </>
            )}
        </div>
    );
};

export { callBackend } from "./hooks/useSettings";
