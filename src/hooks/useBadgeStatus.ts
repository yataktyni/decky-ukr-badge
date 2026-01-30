// decky-ukr-badge/src/hooks/useBadgeStatus.ts
import { useState, useEffect } from "react";
import { fetchNoCors } from "@decky/api";
import { callBackend } from "./useSettings";
import {
    fetchSteamGameLanguages,
    hasUkrainianSupport,
    cleanNonSteamName,
} from "../utils";

export type BadgeStatus = "OFFICIAL" | "COMMUNITY" | "NONE";

interface CacheEntry {
    timestamp: number;
    status: BadgeStatus;
    url?: string;
}

interface CacheData {
    [appId: string]: CacheEntry;
}

const CACHE_KEY = "decky-ukr-badge-cache";
const CACHE_DURATION = 86400000; // 1 day in ms

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
 * Hook to manage fetching and caching of Ukrainian localization status
 */
export function useBadgeStatus(appId: string | undefined, appName: string | undefined) {
    const [status, setStatus] = useState<BadgeStatus | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchStatus() {
            if (!appId) {
                setLoading(false);
                return;
            }

            // Cache check
            const cache = getCache();
            const cached = cache[appId];
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                setStatus(cached.status);
                setUrl(cached.url || null);
                setLoading(false);
                return;
            }

            try {
                let currentAppName = cleanNonSteamName(appName || "");
                const isSteamId = appId && (parseInt(appId) < 1000000000);

                let steamStatus: BadgeStatus | null = null;

                if (!isSteamId) {
                    console.log(`[decky-ukr-badge] Non-Steam game detected: ${currentAppName} (${appId})`);
                }

                // 1. Aggressive Store Metadata Check (Primary for Steam games)
                if (isSteamId) {
                    try {
                        const steamResp = await fetchNoCors(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`);
                        const steamData = await steamResp.json();
                        if (steamData && steamData[appId]?.success) {
                            currentAppName = steamData[appId].data.name;
                            const languages = steamData[appId].data.supported_languages || "";
                            if (languages.toLowerCase().includes("ukrainian")) {
                                steamStatus = "OFFICIAL";
                            }
                        }

                        // FALLBACK: If API says NO, check Store Page HTML directly.
                        // Some games (e.g. Intravenous, Bad 2 Bad) don't list UA in API but do on Store Page.
                        if (steamStatus !== "OFFICIAL") {
                            console.log(`[decky-ukr-badge] API said NO/Empty, trying Store Page HTML for ${appId}`);
                            const htmlResp = await fetchNoCors(`https://store.steampowered.com/app/${appId}`);
                            if (htmlResp.ok) {
                                const html = await htmlResp.text();
                                // Check for "Ukrainian" text in the languages area
                                // Simple regex check is usually sufficient for "supported languages" section
                                if (html.includes("Ukrainian") || html.includes("Українська")) {
                                    console.log(`[decky-ukr-badge] Found Ukrainian in Store HTML for ${appId}`);
                                    steamStatus = "OFFICIAL";

                                    // Also try to grab name if we missed it
                                    if (!currentAppName || currentAppName === "") {
                                        const titleMatch = html.match(/<div class="apphub_AppName">([^<]+)<\/div>/);
                                        if (titleMatch) currentAppName = titleMatch[1];
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`[decky-ukr-badge] Store metadata fetch failed for ${appId}:`, e);
                    }
                }

                // 2. Kuli Community Support (via Backend)
                // We proceed to check Kuli even if Steam found it, to resolve the URL for clickability
                let kuliStatus: BadgeStatus | null = null;
                let kuliUrl: string | null = null;

                if (!cancelled && currentAppName) {
                    console.log(`[decky-ukr-badge] Resolving Kuli for: ${currentAppName} (ID: ${appId})`);
                    try {
                        const response = await callBackend<{ status: string; url: string }>("get_kuli_status", currentAppName);
                        if (!cancelled && response && (response.status === "OFFICIAL" || response.status === "COMMUNITY")) {
                            kuliStatus = response.status as BadgeStatus;
                            kuliUrl = response.url;
                        }
                    } catch (e) {
                        console.error(`[decky-ukr-badge] Backend status fetch failed for ${currentAppName}:`, e);
                    }
                }

                // 3. Merge Results
                let finalStatus: BadgeStatus = "NONE";

                if (steamStatus === "OFFICIAL") {
                    finalStatus = "OFFICIAL";
                } else if (kuliStatus) {
                    finalStatus = kuliStatus;
                }

                const finalUrl = kuliUrl; // Only have URL if Kuli found it

                // Save and Cache
                if (!cancelled) {
                    setStatus(finalStatus);
                    setUrl(finalUrl);
                    cache[appId] = { timestamp: Date.now(), status: finalStatus, url: finalUrl || undefined };
                    setCache(cache);
                }

            } catch (e) {
                console.error("[decky-ukr-badge] Status fetch failed:", e);
                if (!cancelled) setStatus("NONE");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        setLoading(true);
        fetchStatus();

        return () => { cancelled = true; };
    }, [appId, appName]);

    return { status, url, loading };
}
