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

    // Prioritize passed props over hook values
    const appId = pAppId || hAppId;
    const appName = pAppName || hAppName;

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
    const isClickable = status !== "NONE";
    const gameName = appName ? urlifyGameName(appName) : "";
    const clickUrl = kuliUrl || `https://kuli.com.ua/${gameName}`;

    const style: React.CSSProperties = {
        position: "absolute",
        zIndex: 1000,
        transition: "all 0.3s ease",
    };

    const base = settings.badgePosition === "top-left" ? { top: "40px", left: "0px" } : { top: "60px", right: "0px" };
    let top = parseInt(base.top);

    style.top = `calc(${top}px + ${settings.offsetY}px)`;
    if (base.left) style.left = `calc(${base.left} + ${settings.offsetX}px)`;
    if (base.right) style.right = `calc(${base.right} + ${settings.offsetX}px)`;

    const BadgeIcon = config.icon;

    return (
        <div
            ref={ref}
            style={style}
            onClick={() => isClickable && openInSteamBrowser(clickUrl)}
        >
            <button
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    backgroundColor: config.color,
                    color: status === "COMMUNITY" ? "#000" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    boxShadow: `0 4px 12px ${config.shadow}`,
                    cursor: isClickable ? "pointer" : "default",
                    opacity: status === "NONE" ? 0.8 : 1,
                    fontFamily: '"Motiva Sans", sans-serif',
                    transition: "all 0.3s ease",
                }}
            >
                <span style={{ fontSize: "20px", lineHeight: 1 }}>🇺🇦</span>
                <BadgeIcon size={16} />
                {label && <span>{label}</span>}
            </button>
        </div>
    );
};

export default Badge;
