// decky-ukr-badge/src/components/HeaderBadge.tsx
import React from "react";
import { Navigation } from "@decky/ui";
import { useAppId } from "../hooks/useAppId";
import { useBadgeStatus } from "../hooks/useBadgeStatus";
import { t, getSupportedLanguage } from "../translations";
import { urlifyGameName } from "../utils";

const STATUS_COLORS = {
    OFFICIAL: "#28a745",
    COMMUNITY: "#ffc107",
    NONE: "#dc3545",
} as const;

export default function HeaderBadge() {
    const { appId, appName, isLoading: appIdLoading } = useAppId();
    const { status, loading: statusLoading } = useBadgeStatus(appId, appName);
    const lang = getSupportedLanguage();

    if (appIdLoading || statusLoading || !status) return null;

    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.NONE;
    const label = status === "OFFICIAL" ? t("official", lang) : status === "COMMUNITY" ? t("community", lang) : t("none", lang);
    const isClickable = status !== "NONE" && !!appName;

    return (
        <button
            onClick={() => isClickable && Navigation.NavigateToExternalWeb(`https://kuli.com.ua/${urlifyGameName(appName!)}`)}
            disabled={!isClickable}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                backgroundColor: color,
                color: status === "COMMUNITY" ? "#000" : "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "12px",
                cursor: isClickable ? "pointer" : "default",
                marginRight: "10px",
                verticalAlign: "middle",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
        >
            <span style={{ fontSize: "1.2em", lineHeight: 1 }}>🇺🇦</span>
            <span>{label}</span>
        </button>
    );
}
