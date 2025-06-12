// decky-ukr-badge/index.tsx
// React is provided globally by Decky Loader as SP_REACT
import React, { useEffect, useState } from "react";
import { definePlugin, call } from "@decky/api";
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

            const kuliStatus = await fetchKuliTranslationStatus(gameName);
            if (kuliStatus === "OFFICIAL") {
                setStatus("OFFICIAL");
                cache[appId] = { timestamp: Date.now(), status: "OFFICIAL" };
                setCache(cache);
                return;
            } else if (kuliStatus === "COMMUNITY") {
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
        ...(position === "top-left" && { left: `${offsetX}px` }),
        ...(position === "top-right" && { right: `${offsetX}px` }),
        backgroundColor: badge.color,
        padding: "4px 8px",
        borderRadius: "6px",
        fontWeight: "bold",
        cursor: status !== "NONE" ? "pointer" : "default",
        zIndex: 9999,
        color: status === "NONE" ? "#fff" : "#000",
    };

    const text = badgeType === "default" ? badge.text : `${badge.text} ${t("ukrainian")}`;
    const onClick = status !== "NONE" ? () => openInSteamBrowser(`https://kuli.com.ua/${gameName}#translations`) : null;

    return (
        <div style={badgeStyle} { ...(onClick && { onClick }) }>
            {text}
        </div>
    );
}

function MainPluginContent() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        call("get_settings", {}).then((resp: any) => {
            if (resp.success && resp.result) {
                setSettings({ ...DEFAULT_SETTINGS, ...resp.result });
            }
            setLoading(false);
        });
    }, []);

    return loading ? (
        <div>Loading...</div>
    ) : (
        <UAStatusBadge
            appId={getGameId()}
            gameName={getGameNameUrlified()}
            position={settings.badgePosition}
            offsetX={settings.offsetX}
            offsetY={settings.offsetY}
            badgeType={settings.badgeType}
        />
    );
}

export default definePlugin(() => {
    return {
        name: "decky-ukr-badge",
        title: React.createElement("div", null, "UA Localization Badge"),
        description: React.createElement("div", null, t("plugin_description")),
        icon: React.createElement(FaFlag, null),
        settings: React.createElement(Settings, { serverAPI: call }),
        content: (
            React.createElement("div", { style: { marginTop: "20px" } },
                React.createElement(MainPluginContent, null)
            )
        ),
    };
});
