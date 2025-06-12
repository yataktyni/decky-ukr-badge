// decky-ukr-badge/index.tsx
import React, { useEffect, useState } from "react";
import { definePlugin, ServerAPI } from "decky-frontend-lib";
import { fetchSteamGameLanguages, fetchKuliTranslationStatus, getGameId, getGameNameUrlified, openInSteamBrowser } from "./utils";
import { Settings, DEFAULT_SETTINGS } from "./settings";
import { t } from "./translations";
import { FaFlag } from "react-icons/fa";

const BADGE_STATES = {
    OFFICIAL: { text: "🇺🇦 🫡", color: "#28a745" },
    COMMUNITY: { text: "🇺🇦 🫂", color: "#ffc107" },
    NONE: { text: "🇺🇦 ❌", color: "#dc3545" },
};

type BadgeStatus = keyof typeof BADGE_STATES;

const CACHE_KEY = "decky-ukr-badge-cache";
const CACHE_DURATION = 86400000; // 1 day

function getCache() {
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch {
        return {};
    }
}

function setCache(newCache: Record<string, any>) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
}

function UAStatusBadge({ appId, gameName, position, offsetX, offsetY, badgeType }: any) {
    const [status, setStatus] = useState<BadgeStatus | null>(null);
    const cache = getCache();

    useEffect(() => {
        async function fetchStatus() {
            if (cache[appId] && Date.now() - cache[appId].timestamp < CACHE_DURATION) {
                setStatus(cache[appId].status as BadgeStatus);
                return;
            }

            const steamLanguages = await fetchSteamGameLanguages(appId);
            if (steamLanguages?.includes("Ukrainian")) {
                setStatus("OFFICIAL");
                cache[appId] = { timestamp: Date.now(), status: "OFFICIAL" };
                setCache(cache);
                return;
            }

            const hasKuli = await fetchKuliTranslationStatus(gameName);
            if (hasKuli) {
                setStatus("COMMUNITY");
                cache[appId] = { timestamp: Date.now(), status: "COMMUNITY" };
                setCache(cache);
                return;
            }

            setStatus("NONE");
            cache[appId] = { timestamp: Date.now(), status: "NONE" };
            setCache(cache);
        }

        fetchStatus();
    }, [appId, gameName]);

    if (!status) return null;

    const badge = BADGE_STATES[status];
    const badgeStyle: React.CSSProperties = {
        position: "absolute",
        top: position === "top-left" || position === "top-right" ? `${offsetY}px` : "10px",
        left: position === "top-left" ? `${offsetX}px` : undefined,
        right: position === "top-right" ? `${offsetX}px` : undefined,
        backgroundColor: badge.color,
        padding: "4px 8px",
        borderRadius: "6px",
        fontWeight: "bold",
        cursor: status !== "NONE" ? "pointer" : "default",
        zIndex: 9999,
        color: status === "NONE" ? "#fff" : "#000",
    };

    const text = badgeType === "default" ? badge.text : `${badge.text} ${t("ukrainian")}`;
    const onClick = status !== "NONE" ? () => openInSteamBrowser(`https://kuli.com.ua/${gameName}#translations`) : undefined;

    return (
        <div style={badgeStyle} onClick={onClick}>
            {text}
        </div>
    );
}

export default definePlugin((serverAPI: ServerAPI) => {
    const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        serverAPI.callPluginMethod("get_settings", {}).then((resp: any) => {
            if (resp.success && resp.result) {
                setSettings({ ...DEFAULT_SETTINGS, ...resp.result });
            }
            setLoading(false);
        });
    }, []);

    return {
        title: () => "UA Localization Badge",
        description: () => t("plugin_description"),
        icon: <FaFlag />,
        settings: () => <Settings serverAPI={serverAPI} />, 
        content: () => {
            if (loading) return <div>Loading...</div>;
            const appId = getGameId();
            const gameName = getGameNameUrlified();
            const { badgePosition, offsetX, offsetY, badgeType } = settings;
            return (
                <div>
                    <UAStatusBadge
                        appId={appId}
                        gameName={gameName}
                        position={badgePosition}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        badgeType={badgeType}
                    />
                </div>
            );
        },
    };
});
