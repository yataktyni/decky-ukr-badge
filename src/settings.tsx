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
import { FaSteam, FaYoutube } from "react-icons/fa";

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
        setStoreOffsetX,
        setStoreOffsetY,
    } = useSettings();
    const [cacheCleared, setCacheCleared] = useState(false);
    const [offsetXValue, setOffsetXValue] = useState(10);
    const [offsetYValue, setOffsetYValue] = useState(10);
    const [storeOffsetXValue, setStoreOffsetXValue] = useState(0);
    const [storeOffsetYValue, setStoreOffsetYValue] = useState(0);

    const [offsetXTimeout, setOffsetXTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [offsetYTimeout, setOffsetYTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [storeOffsetXTimeout, setStoreOffsetXTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [storeOffsetYTimeout, setStoreOffsetYTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [showKofiQR, setShowKofiQR] = useState(false);

    // Create local state for slider values that syncs with settings but allows smooth sliding
    // We use a useEffect to update local state when settings change from outside (e.g. load)
    useEffect(() => {
        setOffsetXValue(settings.offsetX);
    }, [settings.offsetX]);

    useEffect(() => {
        setOffsetYValue(settings.offsetY);
    }, [settings.offsetY]);

    useEffect(() => {
        setStoreOffsetXValue(settings.storeOffsetX);
    }, [settings.storeOffsetX]);

    useEffect(() => {
        setStoreOffsetYValue(settings.storeOffsetY);
    }, [settings.storeOffsetY]);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (offsetXTimeout) clearTimeout(offsetXTimeout);
            if (offsetYTimeout) clearTimeout(offsetYTimeout);
            if (storeOffsetXTimeout) clearTimeout(storeOffsetXTimeout);
            if (storeOffsetYTimeout) clearTimeout(storeOffsetYTimeout);
        };
    }, []);

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

    // Navigate to external URL
    const openExternalUrl = (url: string) => {
        try {
            if (typeof SteamClient !== "undefined" && SteamClient.System?.OpenInSystemBrowser) {
                SteamClient.System.OpenInSystemBrowser(url);
                return;
            }
            // Fallback methods
            if (Navigation && typeof Navigation.NavigateToExternalWeb === "function") {
                Navigation.NavigateToExternalWeb(url);
                return;
            }
            if (typeof window !== "undefined" && window.open) {
                window.open(url, "_blank");
            }
        } catch (e) {
            console.error("[decky-ukr-badge] Error opening URL:", e);
        }
    };

    const kofiUrl = "https://ko-fi.com/yataktyni";
    const instructionUrl = "https://www.youtube.com/watch?v=24gxXddKNv0";
    const steamGuideUrl = "https://steamcommunity.com/sharedfiles/filedetails/?id=3137617136";

    // Generate QR code for ko-fi URL
    const generateQRCode = (url: string): string => {
        const encoded = encodeURIComponent(url);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
    };

    const kofiQRUrl = generateQRCode(kofiUrl);

    // Handle slider changes with debouncing
    const createSliderHandler = (
        setter: (val: number) => void,
        persister: (val: number) => void,
        timeoutState: ReturnType<typeof setTimeout> | null,
        timeoutSetter: (t: ReturnType<typeof setTimeout> | null) => void
    ) => {
        return (value: number) => {
            setter(value);
            if (timeoutState) clearTimeout(timeoutState);
            const timeout = setTimeout(() => {
                persister(value);
            }, 300); // 300ms debounce
            timeoutSetter(timeout);
        };
    };

    const handleOffsetXChange = createSliderHandler(setOffsetXValue, setOffsetX, offsetXTimeout, setOffsetXTimeout);
    const handleOffsetYChange = createSliderHandler(setOffsetYValue, setOffsetY, offsetYTimeout, setOffsetYTimeout);
    const handleStoreOffsetXChange = createSliderHandler(setStoreOffsetXValue, setStoreOffsetX, storeOffsetXTimeout, setStoreOffsetXTimeout);
    const handleStoreOffsetYChange = createSliderHandler(setStoreOffsetYValue, setStoreOffsetY, storeOffsetYTimeout, setStoreOffsetYTimeout);

    if (loading) {
        return (
            <PanelSection title={t("settings_title", lang)}>
                <PanelSectionRow>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
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

    // Find currently selected option index properly
    const selectedBadgeTypeIndex = badgeTypeOptions.findIndex(o => o.value === settings.badgeType);
    const selectedPositionIndex = positionOptions.findIndex(o => o.value === settings.badgePosition);

    return (
        <>
            <PanelSection title={t("settings_title", lang)}>
                <PanelSectionRow>
                    <DropdownItem
                        label={t("badge_type", lang)}
                        description={t("badge_type_caption", lang)}
                        menuLabel={t("badge_type", lang)}
                        rgOptions={badgeTypeOptions}
                        selectedOption={selectedBadgeTypeIndex !== -1 ? selectedBadgeTypeIndex : 0}
                        onChange={(newVal: { data: number; label: string }) => {
                            const option = badgeTypeOptions.find(o => o.data === newVal.data);
                            if (option) {
                                setBadgeType(option.value);
                            }
                        }}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <DropdownItem
                        label={t("badge_position", lang)}
                        description={t("badge_position_caption", lang)}
                        menuLabel={t("badge_position", lang)}
                        rgOptions={positionOptions}
                        selectedOption={selectedPositionIndex !== -1 ? selectedPositionIndex : 0} // Default to top-left (index 0)
                        onChange={(newVal: { data: number; label: string }) => {
                            const option = positionOptions.find(o => o.data === newVal.data);
                            if (option) {
                                setBadgePosition(option.value);
                            }
                        }}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <ToggleField
                        label={t("show_on_store", lang)}
                        description={t("show_on_store_caption", lang)}
                        checked={settings.showOnStore}
                        onChange={setShowOnStore}
                    />
                </PanelSectionRow>

                {settings.showOnStore && (
                    <>
                        <PanelSectionRow>
                            <SliderField
                                label={t("store_x_offset", lang)}
                                value={storeOffsetXValue}
                                min={-200}
                                max={200}
                                step={1}
                                onChange={handleStoreOffsetXChange}
                                showValue
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <SliderField
                                label={t("store_y_offset", lang)}
                                value={storeOffsetYValue}
                                min={-200}
                                max={200}
                                step={1}
                                onChange={handleStoreOffsetYChange}
                                showValue
                            />
                        </PanelSectionRow>
                    </>
                )}

                <PanelSectionRow>
                    <SliderField
                        label={t("x_offset", lang)}
                        value={offsetXValue}
                        min={0}
                        max={300}
                        step={1}
                        onChange={handleOffsetXChange}
                        showValue
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <SliderField
                        label={t("y_offset", lang)}
                        value={offsetYValue}
                        min={0}
                        max={300}
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
                {/* Donate Row - Horizontal Layout */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    gap: "12px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        {/* Ko-fi Icon SVG */}
                        <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#FF5E5B">
                            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 5.422-2.721 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-4.417-2.924-5.466-2.937-5.408-.267-.059 1.941-1.42 2.613-2.193.376-.433.973-.243.973-.243s.694-.239 1.139.298c1.328 1.602 2.766 2.368 2.641 3.637zm5.467 1.258c-.792 1.34-2.887 1.229-2.887 1.229V6.366s1.611-.08 2.559.576c1.378.956 1.121 2.809.328 3.264z" />
                        </svg>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{t("support_on_kofi", lang)}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            style={{
                                backgroundColor: "#FF5E5B",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "8px 16px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                fontSize: "12px",
                                minWidth: "80px"
                            }}
                            onClick={() => openExternalUrl(kofiUrl)}
                        >
                            Donate
                        </button>

                        <button
                            onClick={() => setShowKofiQR(!showKofiQR)}
                            style={{
                                background: "rgba(255, 255, 255, 0.1)",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                padding: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white"
                            }}
                            title={showKofiQR ? "Hide QR Code" : "Show QR Code"}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 2h2v2h-2v-2zm3 3h3v3h-3v-3zm-3-3h-3v2h3v-2zm-3 3h3v3h-3v-3zm3 3h2v2h-2v-2z" fillRule="evenodd" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {showKofiQR && (
                    <PanelSectionRow>
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "16px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            marginTop: "8px",
                            marginBottom: "16px"
                        }}>
                            <img
                                src={kofiQRUrl}
                                alt="Ko-fi QR Code"
                                style={{ width: "200px", height: "200px", imageRendering: "pixelated" }}
                            />
                        </div>
                    </PanelSectionRow>
                )}

                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 16px" }} />

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => openExternalUrl("https://kuli.com.ua/")}
                    >
                        🇺🇦 Kuli.com.ua
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => openExternalUrl(instructionUrl)}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <FaYoutube size={16} />
                            {t("video_guide", lang)}
                        </div>
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => openExternalUrl(steamGuideUrl)}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <FaSteam size={16} />
                            {t("text_guide", lang)}
                        </div>
                    </ButtonItem>
                </PanelSectionRow>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 16px" }} />

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => openExternalUrl("https://github.com/yataktyni/decky-ukr-badge")}
                    >
                        📦 GitHub
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
        </>
    );
};

// Re-export callBackend for backward compatibility
export { callBackend } from "./hooks/useSettings";
