// decky-ukr-badge/src/components/Badge.tsx
import React, { useEffect, useState, useRef } from "react";
import { FaCheckCircle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import {
    Navigation,
    appDetailsClasses,
    appDetailsHeaderClasses,
    Focusable,
} from "@decky/ui";

import { useAppId } from "../hooks/useAppId";
import { useSettings } from "../hooks/useSettings";
import { useBadgeStatus } from "../hooks/useBadgeStatus";
import { t, getSupportedLanguage } from "../translations";
import { urlifyGameName, openInSteamBrowser } from "../utils";

const BADGE_CONFIG = {
    OFFICIAL: { icon: FaCheckCircle, color: "#28a745", shadow: "rgba(40, 167, 69, 0.4)" },
    COMMUNITY: { icon: FaInfoCircle, color: "#ffc107", shadow: "rgba(255, 193, 7, 0.4)" },
    NONE: { icon: FaTimesCircle, color: "#dc3545", shadow: "rgba(220, 53, 69, 0.4)" },
} as const;

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
    pAppId?: string;
    pAppName?: string;
}

const Badge: React.FC<BadgeProps> = ({ pAppId, pAppName }) => {
    const { settings, loading: settingsLoading } = useSettings();
    const { appId: hAppId, appName: hAppName, isLoading: hLoading } = useAppId();

    // Prioritize passed props over hook values, but allow fallback to local State extraction
    const [localAppName, setLocalAppName] = useState(pAppName || hAppName || "");

    useEffect(() => {
        if (!localAppName) {
            // Attempt to grab from document title if all else fails (common for Non-Steam)
            // Title format: "Game Name" or "Game Name - Steam" or similar
            let title = document.title;
            if (title) {
                title = title.replace(" - Steam", "").trim();
                // Filter out generic titles
                if (title !== "Steam" && title !== "Library" && title !== "Home") {
                    console.log("[decky-ukr-badge] Extracted name from title:", title);
                    setLocalAppName(title);
                }
            }
        }
    }, [pAppName, hAppName, localAppName]);

    const appId = pAppId || hAppId;
    const appName = localAppName;

    const { status, url: kuliUrl, loading: statusLoading } = useBadgeStatus(appId, appName);
    const { badgeType } = settings;
    const lang = getSupportedLanguage();

    const [isVisible, setIsVisible] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const topCapsule = findTopCapsuleParent(ref.current);
        if (!topCapsule) return undefined;

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === "attributes" && m.attributeName === "class") {
                    const cl = String((m.target as any).className || "");
                    const isFs = cl.includes("FullscreenEnter") || (cl.includes("FullscreenExit") && !cl.includes("ExitDone"));
                    setIsVisible(!isFs);
                }
            }
        });

        observer.observe(topCapsule, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, [status]);

    if (hLoading || statusLoading || settingsLoading || !status || !isVisible) return null;

    const config = BADGE_CONFIG[status as keyof typeof BADGE_CONFIG] || BADGE_CONFIG.NONE;
    const label = badgeType === "full" ? t(status.toLowerCase(), lang) : "";
    const isClickable = !!kuliUrl;
    const clickUrl = kuliUrl || "";

    const style: React.CSSProperties = {
        position: "absolute",
        zIndex: 1000,
        transition: "all 0.3s ease",
    };

    const base = settings.badgePosition === "top-left" ? { top: "0px", left: "0px" } : { top: "0px", right: "0px" };
    let top = parseInt(base.top);

    style.top = `calc(${top}px + ${settings.offsetY}px)`;
    if (base.left) style.left = `calc(${base.left} + ${settings.offsetX}px)`;
    if (base.right) style.right = `calc(${base.right} + ${settings.offsetX}px)`;

    const [isFocused, setIsFocused] = useState(false);

    const BadgeIcon = config.icon;

    // Helper to lighten colors for focus state
    const getFocusedColor = (color: string) => {
        if (status === "OFFICIAL") return "#34ce57"; // Lighter green
        if (status === "COMMUNITY") return "#ffcd39"; // Lighter yellow
        return color;
    };

    return (
        <div
            ref={ref}
            style={{ ...style, pointerEvents: "none" }} // Pass through clicks on wrapper
        >
            <Focusable
                onActivate={() => isClickable && openInSteamBrowser(clickUrl)}
                onClick={() => isClickable && openInSteamBrowser(clickUrl)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    backgroundColor: isFocused ? getFocusedColor(config.color) : config.color,
                    color: status === "COMMUNITY" ? "#000" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    boxShadow: isFocused ? `0 0 0 3px rgba(255,255,255,0.4), 0 4px 12px ${config.shadow}` : `0 4px 12px ${config.shadow}`,
                    cursor: isClickable ? "pointer" : "default",
                    opacity: status === "NONE" ? 0.8 : 1,
                    fontFamily: '"Motiva Sans", sans-serif',
                    transition: "all 0.2s ease-in-out",
                    transform: isFocused ? "scale(1.05)" : "scale(1)",
                    pointerEvents: "auto", // Re-enable pointer events for the button
                }}
            >
                <span style={{ fontSize: "20px", lineHeight: "1" }}>🇺🇦</span>
                <BadgeIcon size={16} />
                {label && <span>{label}</span>}
            </Focusable>
        </div>
    );
};

export default Badge;
