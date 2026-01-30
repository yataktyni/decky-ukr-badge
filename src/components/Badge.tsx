// decky-ukr-badge/src/components/Badge.tsx
import React, { useState, useRef } from "react";
import { FaCheckCircle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import {
    Focusable,
} from "@decky/ui";

import { useAppId } from "../hooks/useAppId";
import { useSettings } from "../hooks/useSettings";
import { useBadgeStatus } from "../hooks/useBadgeStatus";
import { t, getSupportedLanguage } from "../translations";
import { openInSteamBrowser } from "../utils";

const BADGE_CONFIG = {
    OFFICIAL: { icon: FaCheckCircle, color: "#28a745", shadow: "rgba(40, 167, 69, 0.4)" },
    COMMUNITY: { icon: FaInfoCircle, color: "#ffc107", shadow: "rgba(255, 193, 7, 0.4)" },
    NONE: { icon: FaTimesCircle, color: "#dc3545", shadow: "rgba(220, 53, 69, 0.4)" },
} as const;

interface BadgeProps {
    pAppId?: string;
    pAppName?: string;
}

const Badge: React.FC<BadgeProps> = ({ pAppId, pAppName }) => {
    const { settings, loading: settingsLoading } = useSettings();
    const { appId: hAppId, appName: hAppName, isLoading: hLoading } = useAppId();

    const appId = pAppId || hAppId;
    const appName = pAppName || hAppName || "";

    const { status, url: kuliUrl, loading: statusLoading } = useBadgeStatus(appId, appName);
    const { badgeType } = settings;
    const lang = getSupportedLanguage();

    const [isFocused, setIsFocused] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    if (hLoading || statusLoading || settingsLoading || !status) return null;

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
    style.top = `calc(0px + ${settings.offsetY}px)`;
    if (base.left) style.left = `calc(0px + ${settings.offsetX}px)`;
    if (base.right) style.right = `calc(0px + ${settings.offsetX}px)`;

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
            style={{ ...style }}
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
                    pointerEvents: "auto",
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
