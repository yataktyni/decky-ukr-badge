// decky-ukr-badge/src/components/Badge.tsx
import React, { useEffect, useState, useRef } from "react";
import { FaCheckCircle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import {
    Navigation,
    appDetailsClasses,
    appDetailsHeaderClasses,
} from "@decky/ui";

import { useAppId } from "../hooks/useAppId";
import { useSettings } from "../hooks/useSettings";
import { useDebugSettings } from "../hooks/useDebugSettings";
import {
    fetchSteamGameLanguages,
    fetchKuliTranslationStatus,
    hasUkrainianSupport,
    urlifyGameName,
} from "../utils";
import { t, getSupportedLanguage } from "../translations";

// Badge status types
type BadgeStatus = "OFFICIAL" | "COMMUNITY" | "NONE";

// Badge configuration
// Badge configuration
const BADGE_CONFIG = {
    OFFICIAL: {
        icon: FaCheckCircle,
        text: "🇺🇦",
        color: "#28a745",
        textColor: "#fff",
    },
    COMMUNITY: {
        icon: FaInfoCircle,
        text: "🇺🇦",
        color: "#ffc107",
        textColor: "#000",
    },
    NONE: {
        icon: FaTimesCircle,
        text: "🇺🇦",
        color: "#dc3545",
        textColor: "#fff",
    },
} as const;

// Position settings matching ProtonDB style
// Adjusted to avoid overlap when ProtonDB badge exists
const POSITION_SETTINGS_WITH_PROTONDB = {
    "top-left": { top: "90px", left: "20px" }, // Below ProtonDB (which is usually at ~40px)
    "top-right": { top: "100px", right: "20px" },
} as const;

const POSITION_SETTINGS = {
    "top-left": { top: "40px", left: "20px" },
    "top-right": { top: "40px", right: "20px" },
} as const;

const STORE_BASE_POSITION = {
    bottom: "60px",
    left: "50%",
    transform: "translateX(-50%)",
} as const;

// Cache configuration
const CACHE_KEY = "decky-ukr-badge-cache";
const CACHE_DURATION = 86400000; // 1 day in ms

interface CacheEntry {
    timestamp: number;
    status: BadgeStatus;
}

interface CacheData {
    [appId: string]: CacheEntry;
}

function getCache(): CacheData {
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch {
        return {};
    }
}

function setCache(newCache: CacheData): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch (e) {
        console.error("[decky-ukr-badge] Failed to save cache:", e);
    }
}

/**
 * Finds the TopCapsule parent element for visibility tracking
 */
function findTopCapsuleParent(ref: HTMLDivElement | null): Element | null {
    const children = ref?.parentElement?.children;
    if (!children) return null;

    let headerContainer: Element | undefined;
    for (const child of children) {
        if (child.className.includes(appDetailsClasses.Header)) {
            headerContainer = child;
            break;
        }
    }

    if (!headerContainer) return null;

    let topCapsule: Element | null = null;
    for (const child of headerContainer.children) {
        if (child.className.includes(appDetailsHeaderClasses.TopCapsule)) {
            topCapsule = child;
            break;
        }
    }

    return topCapsule;
}

interface BadgeProps {
    protonDBExists?: boolean;
    isStore?: boolean;
    appId?: string;
    appName?: string;
}

/**
 * Badge component that displays Ukrainian localization status
 */
export default function Badge({
    protonDBExists = false,
    isStore = false,
    appId: propAppId,
    appName: propAppName
}: BadgeProps): React.ReactElement | null {
    const { appId: hookAppId, appName: hookAppName, isLoading: hookLoading } = useAppId();

    const appId = propAppId || hookAppId;
    // If we have a prop name, use it. Otherwise use hook name.
    const appName = propAppName || hookAppName;
    // If props are provided, we are not loading from hook (or parent handles loading)
    const appLoading = propAppId ? false : hookLoading;

    const { settings, loading: settingsLoading } = useSettings();
    const { debugSettings } = useDebugSettings();
    const lang = getSupportedLanguage();

    const [status, setStatus] = useState<BadgeStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(true);
    const ref = useRef<HTMLDivElement | null>(null);

    // Fetch badge status
    useEffect(() => {
        let cancelled = false;

        async function fetchStatus() {
            if (!appId) {
                setLoading(false);
                return;
            }

            // Check Mock Mode
            if (debugSettings.mockMode) {
                setStatus(debugSettings.mockStatus);
                setLoading(false);
                return;
            }

            // Check cache first
            const cache = getCache();
            const cached = cache[appId];
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                setStatus(cached.status);
                setLoading(false);
                return;
            }

            try {
                // Step 1: Check Steam API for official Ukrainian support
                const steamLanguages = await fetchSteamGameLanguages(appId);
                if (
                    !cancelled &&
                    steamLanguages &&
                    hasUkrainianSupport(steamLanguages)
                ) {
                    setStatus("OFFICIAL");
                    cache[appId] = {
                        timestamp: Date.now(),
                        status: "OFFICIAL",
                    };
                    setCache(cache);
                    setLoading(false);
                    return;
                }

                // Step 2: Check kuli.com.ua for community translations
                if (appName) {
                    const kuliStatus =
                        await fetchKuliTranslationStatus(appName);
                    if (!cancelled && kuliStatus) {
                        setStatus(kuliStatus);
                        cache[appId] = {
                            timestamp: Date.now(),
                            status: kuliStatus,
                        };
                        setCache(cache);
                        setLoading(false);
                        return;
                    }
                }

                // No Ukrainian support found
                if (!cancelled) {
                    setStatus("NONE");
                    cache[appId] = { timestamp: Date.now(), status: "NONE" };
                    setCache(cache);
                }
            } catch (e) {
                console.error("[decky-ukr-badge] Error fetching status:", e);
                if (!cancelled) {
                    setStatus("NONE");
                }
            }

            if (!cancelled) {
                setLoading(false);
            }
        }

        setLoading(true);
        fetchStatus();

        return () => {
            cancelled = true;
        };
    }, [appId, appName, debugSettings.mockMode, debugSettings.mockStatus]);

    // Handle fullscreen visibility (like ProtonDB)
    useEffect(() => {
        const topCapsule = findTopCapsuleParent(ref?.current);
        if (!topCapsule) {
            return undefined;
        }

        const mutationObserver = new MutationObserver((entries) => {
            for (const entry of entries) {
                if (
                    entry.type !== "attributes" ||
                    entry.attributeName !== "class"
                ) {
                    continue;
                }

                const className = (entry.target as Element).className;
                const fullscreenMode =
                    className.includes(
                        appDetailsHeaderClasses.FullscreenEnterStart,
                    ) ||
                    className.includes(
                        appDetailsHeaderClasses.FullscreenEnterActive,
                    ) ||
                    className.includes(
                        appDetailsHeaderClasses.FullscreenEnterDone,
                    ) ||
                    className.includes(
                        appDetailsHeaderClasses.FullscreenExitStart,
                    ) ||
                    className.includes(
                        appDetailsHeaderClasses.FullscreenExitActive,
                    );
                const fullscreenAborted = className.includes(
                    appDetailsHeaderClasses.FullscreenExitDone,
                );

                setShow(!fullscreenMode || fullscreenAborted);
            }
        });

        mutationObserver.observe(topCapsule, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            mutationObserver.disconnect();
        };
    }, []);

    // Don't render if loading or no status
    if (appLoading || settingsLoading || loading || !status || !show) {
        return null;
    }

    // Don't render on store if setting is disabled
    if (isStore && !settings.showOnStore) {
        return null;
    }

    const badge = BADGE_CONFIG[status];
    const BadgeIcon = badge.icon;

    // Adjust position if ProtonDB badge exists to avoid overlap
    const positionSettings = protonDBExists ? POSITION_SETTINGS_WITH_PROTONDB : POSITION_SETTINGS;

    let position: any = {};

    if (isStore) {
        position = { ...STORE_BASE_POSITION };
        // Apply store offsets
        // For bottom/left base:
        if (settings.storeOffsetY) position.bottom = `calc(${position.bottom} - ${settings.storeOffsetY}px)`;
        if (settings.storeOffsetX) position.left = `calc(${position.left} + ${settings.storeOffsetX}px)`;
    } else {
        const basePosition =
            positionSettings[settings.badgePosition] ||
            positionSettings["top-right"];

        position = { ...basePosition };
        if (position.top) position.top = `calc(${position.top} + ${settings.offsetY}px)`;
        if (position.left) position.left = `calc(${position.left} + ${settings.offsetX}px)`;
        if (position.right) position.right = `calc(${position.right} + ${settings.offsetX}px)`;
    }

    let statusText = "";
    if (settings.badgeType === "full") {
        statusText =
            status === "OFFICIAL" ? t("official", lang) :
                status === "COMMUNITY" ? t("community", lang) :
                    t("none", lang);
    }

    // Click handler - open kuli.com.ua page
    const handleClick = () => {
        console.log(`[decky-ukr-badge] Clicked badge. Status: ${status}, AppName: ${appName}`);
        if (status !== "NONE" && appName) {
            Navigation.NavigateToExternalWeb(
                `https://kuli.com.ua/${urlifyGameName(appName)}`,
            );
        }
    };

    // Tooltip text
    const tooltipText =
        status === "OFFICIAL"
            ? `${t("ukrainian", lang)} (${t("official", lang)})`
            : status === "COMMUNITY"
                ? `${t("ukrainian", lang)} (${t("community", lang)})`
                : `${t("ukrainian", lang)} (${t("none", lang)})`;

    return (
        <div
            ref={ref}
            className="decky-ukr-badge-container"
            style={{
                position: "absolute",
                zIndex: 9999,
                ...position,
            }}
        >
            <button
                className="decky-ukr-badge"
                onClick={status !== "NONE" ? handleClick : undefined}
                title={tooltipText}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px", // Fixed padding
                    backgroundColor: badge.color,
                    color: badge.textColor,
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: status !== "NONE" ? "pointer" : "default",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    userSelect: "none",
                }}
                onMouseEnter={(e) => {
                    if (status !== "NONE") {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0, 0, 0, 0.5)";
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.4)";
                }}
            >
                <span style={{ fontSize: "1.2em", lineHeight: "1" }}>{badge.text}</span>
                <BadgeIcon size={16} />
                {settings.badgeType === "full" && <span>{statusText}</span>}
            </button>
        </div>
    );
}
