// decky-ukr-badge/src/settings.tsx
import React, { FC, useState } from "react";
import {
    PanelSection,
    PanelSectionRow,
    ButtonItem,
    DropdownItem,
    SliderField,
    Navigation,
} from "@decky/ui";
import { t, getSupportedLanguage } from "./translations";
import { useSettings } from "./hooks/useSettings";
import Spinner from "./components/Spinner";

// Declare SteamClient for TypeScript
declare const SteamClient:
    | {
        System?: {
            OpenInSystemBrowser?: (url: string) => void;
        };
    }
    | undefined;

const CACHE_KEY = "decky-ukr-badge-cache";

export const Settings: FC = () => {
    const {
        settings,
        loading,
        setBadgeType,
        setBadgePosition,
        setOffsetX,
        setOffsetY,
    } = useSettings();
    const [cacheCleared, setCacheCleared] = useState(false);
    const [showKofiQR, setShowKofiQR] = useState(false);

    const lang = getSupportedLanguage();

    // Clear localStorage cache
    const handleClearCache = () => {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log("[decky-ukr-badge] Cleared localStorage cache");
            setCacheCleared(true);
            setTimeout(() => setCacheCleared(false), 2000);
        } catch (e) {
            console.error("[decky-ukr-badge] Failed to clear cache:", e);
        }
    };

    // Navigate to external URL - try multiple methods for compatibility
    const openExternalUrl = (url: string) => {
        try {
            // Try SteamClient first (most reliable method like magicblack plugin)
            if (
                typeof SteamClient !== "undefined" &&
                SteamClient.System?.OpenInSystemBrowser
            ) {
                SteamClient.System.OpenInSystemBrowser(url);
                return;
            }
            // Fallback to Navigation (Decky UI method)
            try {
                if (Navigation && typeof Navigation.NavigateToExternalWeb === "function") {
                    Navigation.NavigateToExternalWeb(url);
                    return;
                }
            } catch (navError) {
                console.warn("[decky-ukr-badge] Navigation method failed:", navError);
            }
            // Last resort - try window.open
            if (typeof window !== "undefined" && window.open) {
                window.open(url, "_blank");
                return;
            }
            console.warn("[decky-ukr-badge] Could not open URL, all methods failed");
        } catch (e) {
            console.error("[decky-ukr-badge] Error opening URL:", e);
        }
    };

    // Generate QR code for ko-fi URL
    const generateQRCode = (url: string): string => {
        // Simple QR code using a QR code API service (no external dependencies)
        const encoded = encodeURIComponent(url);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
    };

    const kofiUrl = "https://ko-fi.com/yataktyni";
    const kofiQRUrl = generateQRCode(kofiUrl);

    if (loading) {
        return (
            <PanelSection title={t("settings_title", lang)}>
                <PanelSectionRow>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 10,
                        }}
                    >
                        <Spinner />
                    </div>
                </PanelSectionRow>
            </PanelSection>
        );
    }

    const badgeTypeOptions = [
        { data: 0, label: t("type_default", lang), value: "default" as const },
        { data: 1, label: t("type_full", lang), value: "full" as const },
    ];

    const positionOptions = [
        { data: 0, label: t("top_left", lang), value: "top-left" as const },
        { data: 1, label: t("top_right", lang), value: "top-right" as const },
    ];

    return (
        <>
            <PanelSection title={t("settings_title", lang)}>
                <PanelSectionRow>
                    <DropdownItem
                        label={t("badge_type", lang)}
                        description={t("badge_type_caption", lang)}
                        menuLabel={t("badge_type", lang)}
                        rgOptions={badgeTypeOptions.map((o) => ({
                            data: o.data,
                            label: o.label,
                        }))}
                        selectedOption={
                            badgeTypeOptions.find(
                                (o) => o.value === settings.badgeType,
                            )?.data || 1
                        }
                        onChange={(newVal: { data: number; label: string }) => {
                            const newType =
                                badgeTypeOptions.find(
                                    (o) => o.data === newVal.data,
                                )?.value || "full";
                            setBadgeType(newType);
                        }}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <DropdownItem
                        label={t("badge_position", lang)}
                        description={t("badge_position_caption", lang)}
                        menuLabel={t("badge_position", lang)}
                        rgOptions={positionOptions.map((o) => ({
                            data: o.data,
                            label: o.label,
                        }))}
                        selectedOption={
                            positionOptions.find(
                                (o) => o.value === settings.badgePosition,
                            )?.data || 1
                        }
                        onChange={(newVal: { data: number; label: string }) => {
                            const newPosition =
                                positionOptions.find(
                                    (o) => o.data === newVal.data,
                                )?.value || "top-right";
                            setBadgePosition(newPosition);
                        }}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <SliderField
                        label="X Offset"
                        value={settings.offsetX}
                        min={0}
                        max={100}
                        step={5}
                        onChange={(value: number) => setOffsetX(value)}
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
                        onChange={(value: number) => setOffsetY(value)}
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
            </PanelSection>

            <PanelSection title="🔗 Links">
                <PanelSectionRow>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <ButtonItem
                            layout="below"
                            onClick={() => openExternalUrl(kofiUrl)}
                        >
                            ❤️ Support on Ko-fi
                        </ButtonItem>
                        <ButtonItem
                            layout="below"
                            onClick={() => setShowKofiQR(!showKofiQR)}
                        >
                            {showKofiQR ? "📱 Hide QR Code" : "📱 Show QR Code"}
                        </ButtonItem>
                        {showKofiQR && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    padding: "16px",
                                    backgroundColor: "#1a1a2e",
                                    borderRadius: "8px",
                                    marginTop: "8px",
                                }}
                            >
                                <img
                                    src={kofiQRUrl}
                                    alt="Ko-fi QR Code"
                                    style={{
                                        width: "200px",
                                        height: "200px",
                                        imageRendering: "pixelated",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() =>
                            openExternalUrl(
                                "https://github.com/yataktyni/decky-ukr-badge",
                            )
                        }
                    >
                        📦 GitHub
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => openExternalUrl("https://kuli.com.ua/")}
                    >
                        🇺🇦 Kuli.com.ua
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
        </>
    );
};

// Re-export callBackend for backward compatibility
export { callBackend } from "./hooks/useSettings";
