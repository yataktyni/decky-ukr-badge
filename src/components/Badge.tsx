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
import { urlifyGameName } from "../utils";

const BADGE_CONFIG = {
    OFFICIAL: { icon: FaCheckCircle, color: "#28a745", shadow: "rgba(40, 167, 69, 0.4)" },
    COMMUNITY: { icon: FaInfoCircle, color: "#ffc107", shadow: "rgba(255, 193, 7, 0.4)" },
    NONE: { icon: FaTimesCircle, color: "#dc3545", shadow: "rgba(220, 53, 69, 0.4)" },
} as const;

function findTopCapsuleParent(ref: HTMLDivElement | null): Element | null {
    const parent = ref?.parentElement;
    if (!parent) return null;
    const header = Array.from(parent.children).find(c => c.className.includes(appDetailsClasses.Header));
    if (!header) return null;
    return Array.from(header.children).find(c => c.className.includes(appDetailsHeaderClasses.TopCapsule)) || null;
}

export default function Badge({
    appId: pAppId,
    appName: pAppName,
    isStore = false,
    protonDBExists = false
}: { appId?: string; appName?: string; isStore?: boolean; protonDBExists?: boolean }) {
    const { appId: hAppId, appName: hAppName, isLoading: hLoading } = useAppId();
    const appId = pAppId || hAppId;
    const appName = pAppName || hAppName;

    const { settings, loading: sLoading } = useSettings();
    const { status, loading: bLoading } = useBadgeStatus(appId, appName);
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

    if (hLoading || sLoading || bLoading || !status || !isVisible) return null;
    if (isStore && !settings.showOnStore) return null;

    const config = BADGE_CONFIG[status];
    const BadgeIcon = config.icon;
    const displayText = settings.badgeType === "full" ? (status === "OFFICIAL" ? t("official", lang) : status === "COMMUNITY" ? t("community", lang) : t("none", lang)) : "";

    const style: React.CSSProperties = {
        position: "absolute",
        zIndex: 999,
        transition: "all 0.3s ease",
    };

    if (isStore) {
        style.bottom = `calc(60px - ${settings.storeOffsetY}px)`;
        style.left = `calc(50% + ${settings.storeOffsetX}px)`;
        style.transform = "translateX(-50%)";
    } else {
        const base = settings.badgePosition === "top-left" ? { top: "40px", left: "20px" } : { top: "40px", right: "20px" };

        // Adjust for ProtonDB if it exists (standard Decky practice)
        let top = parseInt(base.top);
        if (protonDBExists) {
            top += 50; // Shift down to avoid overlapping ProtonDB badge
        }

        style.top = `calc(${top}px + ${settings.offsetY}px)`;
        if (base.left) style.left = `calc(${base.left} + ${settings.offsetX}px)`;
        if (base.right) style.right = `calc(${base.right} + ${settings.offsetX}px)`;
    }

    return (
        <div ref={ref} style={style}>
            <button
                onClick={() => status !== "NONE" && appName && Navigation.NavigateToExternalWeb(`https://kuli.com.ua/${urlifyGameName(appName)}`)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: config.color,
                    color: status === "COMMUNITY" ? "#000" : "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "14px",
                    boxShadow: `0 4px 12px ${config.shadow}`,
                    cursor: status !== "NONE" ? "pointer" : "default",
                }}
            >
                <span style={{ fontSize: "1.2em" }}>🇺🇦</span>
                <BadgeIcon size={18} />
                {displayText && <span>{displayText}</span>}
            </button>
        </div>
    );
}
