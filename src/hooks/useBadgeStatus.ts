// decky-ukr-badge/src/hooks/useBadgeStatus.ts
import { useState, useEffect } from "react";
import { fetchNoCors } from "@decky/api";
import { callBackend } from "./useSettings";
import {
    cleanNonSteamName,
    searchKuli,
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
                let storeName: string | null = null;

                if (!isSteamId) {
                    console.log(`[decky-ukr-badge] Non-Steam game detected: ${currentAppName} (${appId})`);
                }

                // 1. Aggressive Store Metadata Check (Primary for Steam games)
                if (isSteamId) {
                    try {
                        const steamResp = await fetchNoCors(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`);
                        const steamData = await steamResp.json();
                        if (steamData && steamData[appId]?.success) {
                            storeName = steamData[appId].data.name;
                            currentAppName = storeName || currentAppName;
                            const languages = steamData[appId].data.supported_languages || "";
                            if (languages.toLowerCase().includes("ukrainian")) {
                                steamStatus = "OFFICIAL";
                            }
                        }

                        // FALLBACK: If API says NO, check Store Page HTML directly.
                        if (steamStatus !== "OFFICIAL") {
                            console.log(`[decky-ukr-badge] API said NO/Empty, trying Store Page HTML for ${appId}`);
                            const htmlResp = await fetchNoCors(`https://store.steampowered.com/app/${appId}`);
                            if (htmlResp.ok) {
                                const html = await htmlResp.text();
                                if (html.includes("Ukrainian") || html.includes("Українська")) {
                                    console.log(`[decky-ukr-badge] Found Ukrainian in Store HTML for ${appId}`);
                                    steamStatus = "OFFICIAL";

                                    if (!storeName) {
                                        const titleMatch = html.match(/<div class="apphub_AppName">([^<]+)<\/div>/);
                                        if (titleMatch) {
                                            storeName = titleMatch[1];
                                            currentAppName = storeName;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`[decky-ukr-badge] Store metadata fetch failed for ${appId}:`, e);
                    }
                }

                // 2. Kuli Community Support (via Frontend Shared Logic)
                let kuliStatus: BadgeStatus | null = null;
                let kuliUrl: string | null = null;

                // Use the best name we have for search
                let searchName = currentAppName;

                if (!cancelled && searchName) {
                    console.log(`[decky-ukr-badge] Resolving Kuli for: ${searchName} (ID: ${appId})`);
                    try {
                        let response = await searchKuli(searchName);

                        // If searchName failed and we have a storeName that's different, try that too
                        if (!response && storeName && storeName !== searchName) {
                            console.log(`[decky-ukr-badge] Search failed for ${searchName}, trying storeName: ${storeName}`);
                            response = await searchKuli(storeName);
                        }

                        if (!cancelled && response && (response.status === "OFFICIAL" || response.status === "COMMUNITY")) {
                            kuliStatus = response.status as BadgeStatus;
                            kuliUrl = `https://kuli.com.ua/${response.slug}`;
                        }
                    } catch (e) {
                        console.error(`[decky-ukr-badge] Kuli search failed for ${searchName}:`, e);
                    }
                }

                // 3. Merge Results
                let finalStatus: BadgeStatus = "NONE";

                // Store API is the source of truth for OFFICIAL
                if (steamStatus === "OFFICIAL") {
                    finalStatus = "OFFICIAL";
                } else if (kuliStatus) {
                    finalStatus = kuliStatus;
                }

                // URL from Kuli is the source of truth for the link
                const finalUrl = kuliUrl;

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
