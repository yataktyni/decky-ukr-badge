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
import { useBadgeStatus, BadgeStatus } from "../hooks/useBadgeStatus";
import { t, getSupportedLanguage } from "../translations";
import { urlifyGameName } from "../utils";

// Badge configuration with depth & accessibility
const BADGE_CONFIG = {
    OFFICIAL: {
        icon: FaCheckCircle,
        color: "#28a745",
        textColor: "#ffffff",
        shadow: "rgba(40, 167, 69, 0.4)",
    },
    COMMUNITY: {
        icon: FaInfoCircle,
        color: "#ffc107",
        textColor: "#000000",
        shadow: "rgba(255, 193, 7, 0.4)",
    },
    NONE: {
        icon: FaTimesCircle,
        color: "#dc3545",
        textColor: "#ffffff",
        shadow: "rgba(220, 53, 69, 0.4)",
    },
} as const;

const POSITION_SETTINGS = {
    "top-left": { top: "40px", left: "20px" },
    "top-right": { top: "40px", right: "20px" },
} as const;

const POSITION_WITH_PROTONDB = {
    "top-left": { top: "90px", left: "20px" },
    "top-right": { top: "100px", right: "20px" },
} as const;

const STORE_BASE = { bottom: "60px", left: "50%", transform: "translateX(-50%)" };

interface BadgeProps {
    protonDBExists?: boolean;
    isStore?: boolean;
    appId?: string;
    appName?: string;
}

/**
 * Finds the TopCapsule parent element for visibility tracking
 */
function findTopCapsuleParent(ref: HTMLDivElement | null): Element | null {
    const parent = ref?.parentElement;
    if (!parent) return null;

    const header = Array.from(parent.children).find(c => c.className.includes(appDetailsClasses.Header));
    if (!header) return null;

    return Array.from(header.children).find(c => c.className.includes(appDetailsHeaderClasses.TopCapsule)) || null;
}

/**
 * Premium Badge Component: Displays Ukrainian Localization Status
 */
export default function Badge({
    protonDBExists = false,
    isStore = false,
    appId: pAppId,
    appName: pAppName
}: BadgeProps): React.ReactElement | null {
    const { appId: hAppId, appName: hAppName, isLoading: hLoading } = useAppId();
    const appId = pAppId || hAppId;
    const appName = pAppName || hAppName;

    const { settings, loading: sLoading } = useSettings();
    const { status, loading: bLoading } = useBadgeStatus(appId, appName);
    const lang = getSupportedLanguage();

    const [isVisible, setIsVisible] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    // Visibility tracking (Standard Decky/ProtonDB pattern)
    useEffect(() => {
        const topCapsule = findTopCapsuleParent(ref.current);
        if (!topCapsule) return undefined;

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === "attributes" && m.attributeName === "class") {
                    const cl = (m.target as Element).className;
                    const isFs = cl.includes("FullscreenEnter") || (cl.includes("FullscreenExit") && !cl.includes("ExitDone"));
                    setIsVisible(!isFs);
                }
            }
        });

        observer.observe(topCapsule, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, [status]);

    if (hLoading || sLoading || bLoading || !status || !isVisible) return null;
    if (isStore && !settings.showOnStore) return null;

    const config = BADGE_CONFIG[status];
    const BadgeIcon = config.icon;
    const posBase = protonDBExists ? POSITION_WITH_PROTONDB : POSITION_SETTINGS;

    // Dynamic Position Calculation
    let style: React.CSSProperties = { position: "absolute", zIndex: 9999 };
    if (isStore) {
        style = { ...style, ...STORE_BASE };
        if (settings.storeOffsetY) style.bottom = `calc(${style.bottom} - ${settings.storeOffsetY}px)`;
        if (settings.storeOffsetX) style.left = `calc(${style.left} + ${settings.storeOffsetX}px)`;
    } else {
        const base = posBase[settings.badgePosition as keyof typeof posBase] || posBase["top-right"];
        style = { ...style, ...base };
        if (style.top) style.top = `calc(${style.top} + ${settings.offsetY}px)`;
        if (style.left) style.left = `calc(${style.left} + ${settings.offsetX}px)`;
        if (style.right) style.right = `calc(${style.right} + ${settings.offsetX}px)`;
    }

    const displayText = settings.badgeType === "full" ?
        (status === "OFFICIAL" ? t("official", lang) : status === "COMMUNITY" ? t("community", lang) : t("none", lang)) : "";

    const tooltip = `${t("ukrainian", lang)} (${displayText || status.toLowerCase()})`;

    return (
        <div ref={ref} className="ua-badge-wrapper" style={style}>
            <button
                aria-label={tooltip}
                title={tooltip}
                onClick={() => status !== "NONE" && appName && Navigation.NavigateToExternalWeb(`https://kuli.com.ua/${urlifyGameName(appName)}`)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: config.color,
                    color: config.textColor,
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: status !== "NONE" ? "pointer" : "default",
                    boxShadow: `0 4px 12px ${config.shadow}`,
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    userSelect: "none",
                }}
                onMouseEnter={(e) => {
                    if (status !== "NONE") {
                        e.currentTarget.style.transform = "scale(1.08) translateY(-2px)";
                        e.currentTarget.style.boxShadow = `0 8px 20px ${config.shadow}`;
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${config.shadow}`;
                }}
            >
                <span style={{ fontSize: "1.4em", marginBottom: "2px" }}>🇺🇦</span>
                <BadgeIcon size={18} />
                {displayText && <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{displayText}</span>}
            </button>
        </div>
    );
}
