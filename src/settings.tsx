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
        setShowOnStore,
    } = useSettings();
    const [cacheCleared, setCacheCleared] = useState(false);
    const [offsetXValue, setOffsetXValue] = useState(10);
    const [offsetYValue, setOffsetYValue] = useState(10);
    const [offsetXTimeout, setOffsetXTimeout] = useState<NodeJS.Timeout | null>(null);
    const [offsetYTimeout, setOffsetYTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showKofiQR, setShowKofiQR] = useState(false);

    const lang = getSupportedLanguage();

    // Sync local slider values with settings
    useEffect(() => {
        setOffsetXValue(settings.offsetX);
    }, [settings.offsetX]);

    useEffect(() => {
        setOffsetYValue(settings.offsetY);
    }, [settings.offsetY]);

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

    const kofiUrl = "https://ko-fi.com/yataktyni";

    // Generate QR code for ko-fi URL
    const generateQRCode = (url: string): string => {
        const encoded = encodeURIComponent(url);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
    };

    const kofiQRUrl = generateQRCode(kofiUrl);

    // Handle slider changes with debouncing to prevent lag
    const handleOffsetXChange = (value: number) => {
        setOffsetXValue(value);
        if (offsetXTimeout) {
            clearTimeout(offsetXTimeout);
        }
        const timeout = setTimeout(() => {
            setOffsetX(value);
        }, 150);
        setOffsetXTimeout(timeout);
    };

    const handleOffsetYChange = (value: number) => {
        setOffsetYValue(value);
        if (offsetYTimeout) {
            clearTimeout(offsetYTimeout);
        }
        const timeout = setTimeout(() => {
            setOffsetY(value);
        }, 150);
        setOffsetYTimeout(timeout);
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (offsetXTimeout) clearTimeout(offsetXTimeout);
            if (offsetYTimeout) clearTimeout(offsetYTimeout);
        };
    }, [offsetXTimeout, offsetYTimeout]);

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
                            )?.data ?? 1
                        }
                        onChange={(newVal: { data: number; label: string }) => {
                            const newType =
                                badgeTypeOptions.find(
                                    (o) => o.data === newVal.data,
                                )?.value;
                            if (newType) {
                                setBadgeType(newType);
                            }
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
                            )?.data ?? 1
                        }
                        onChange={(newVal: { data: number; label: string }) => {
                            const newPosition =
                                positionOptions.find(
                                    (o) => o.data === newVal.data,
                                )?.value;
                            if (newPosition) {
                                setBadgePosition(newPosition);
                            }
                        }}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <ToggleField
                        label="Show on Store Page"
                        description="Show badge on Game Store pages"
                        checked={settings.showOnStore}
                        onChange={setShowOnStore}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <SliderField
                        label="X Offset"
                        value={offsetXValue}
                        min={0}
                        max={100}
                        step={1}
                        onChange={handleOffsetXChange}
                        showValue
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <SliderField
                        label="Y Offset"
                        value={offsetYValue}
                        min={0}
                        max={100}
                        step={1}
                        onChange={handleOffsetYChange}
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

            <PanelSection title={`🔗 ${t("links", lang)}`}>
                <PanelSectionRow>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ButtonItem
                            layout="below"
                            onClick={() => openExternalUrl(kofiUrl)}
                        >
                            ❤️ {t("support_on_kofi", lang)}
                        </ButtonItem>
                        <button
                            onClick={() => setShowKofiQR(!showKofiQR)}
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "currentColor",
                                marginLeft: "0.5em",
                            }}
                            title={showKofiQR ? "Hide QR Code" : "Show QR Code"}
                        >
                            <svg
                                width="20px"
                                height="20px"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M8.56301 1.2002H3.39768C2.7752 1.20089 2.17841 1.44848 1.73825 1.88864C1.29808 2.3288 1.0505 2.92559 1.0498 3.54807V8.7134C1.0505 9.33588 1.29808 9.93267 1.73825 10.3728C2.17841 10.813 2.7752 11.0606 3.39768 11.0613H8.56301C9.18549 11.0606 9.78228 10.813 10.2224 10.3728C10.6626 9.93267 10.9102 9.33588 10.9109 8.7134V3.54807C10.9102 2.92559 10.6626 2.3288 10.2224 1.88864C9.78228 1.44848 9.18549 1.20089 8.56301 1.2002ZM8.09343 8.24382H3.86726V4.01765H8.09343V8.24382ZM8.56301 12.9385H3.39768C2.7752 12.9392 2.17841 13.1868 1.73825 13.6269C1.29808 14.0671 1.0505 14.6639 1.0498 15.2864V20.4517C1.0505 21.0742 1.29808 21.671 1.73825 22.1111C2.17841 22.5513 2.7752 22.7989 3.39768 22.7996H8.56301C9.18549 22.7989 9.78228 22.5513 10.2224 22.1111C10.6626 21.671 10.9102 21.0742 10.9109 20.4517V15.2864C10.9102 14.6639 10.6626 14.0671 10.2224 13.6269C9.78228 13.1868 9.18549 12.9392 8.56301 12.9385ZM8.09343 19.9821H3.86726V15.7559H8.09343V19.9821ZM15.1374 1.2002H20.3028C20.9252 1.20089 21.522 1.44848 21.9622 1.88864C22.4024 2.3288 22.6499 2.92559 22.6506 3.54807V8.7134C22.6499 9.33588 22.4024 9.93267 21.9622 10.3728C21.522 10.813 20.9252 11.0606 20.3028 11.0613H15.1374C14.5149 11.0606 13.9182 10.813 13.478 10.3728C13.0378 9.93267 12.7902 9.33588 12.7896 8.7134V3.54807C12.7902 2.92559 13.0378 2.3288 13.478 1.88864C13.9182 1.44848 14.5149 1.20089 15.1374 1.2002ZM15.607 8.24382H19.8332V4.01765H15.607V8.24382ZM14.1983 18.5734C14.5719 18.5734 14.9302 18.4249 15.1944 18.1608C15.4586 17.8966 15.607 17.5383 15.607 17.1647V14.3472C15.607 13.9736 15.4586 13.6153 15.1944 13.3511C14.9302 13.0869 14.5719 12.9385 14.1983 12.9385C13.8247 12.9385 13.4663 13.0869 13.2022 13.3511C12.938 13.6153 12.7896 13.9736 12.7896 14.3472V17.1647C12.7896 17.5383 12.938 17.8966 13.2022 18.1608C13.4664 18.4249 13.8247 18.5734 14.1983 18.5734ZM19.8332 14.8168H21.2419C21.6155 14.8168 21.9738 14.9652 22.238 15.2294C22.5022 15.4936 22.6506 15.8519 22.6506 16.2255C22.6506 16.5991 22.5022 16.9574 22.238 17.2216C21.9738 17.4858 21.6155 17.6342 21.2419 17.6342H19.8332V21.3908C19.8332 21.7644 19.6847 22.1227 19.4206 22.3869C19.1564 22.6511 18.7981 22.7995 18.4245 22.7996H14.1983C13.8247 22.7996 13.4663 22.6511 13.2022 22.3869C12.938 22.1228 12.7896 21.7644 12.7896 21.3908C12.7896 21.0172 12.938 20.6589 13.2022 20.3947C13.4663 20.1305 13.8247 19.9821 14.1983 19.9821H17.0157V14.3472C17.0157 13.9736 17.1641 13.6153 17.4283 13.3511C17.6925 13.0869 18.0508 12.9385 18.4245 12.9385C18.7981 12.9385 19.1564 13.0869 19.4206 13.3511C19.6848 13.6153 19.8332 13.9736 19.8332 14.3472V14.8168Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </div>
                </PanelSectionRow>
                {showKofiQR && (
                    <PanelSectionRow>
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
                    </PanelSectionRow>
                )}

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
