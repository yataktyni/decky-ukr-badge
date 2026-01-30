// decky-ukr-badge/src/hooks/useBadgeStatus.ts
import { useState, useEffect } from "react";
import { callBackend } from "./useSettings";
import {
    fetchSteamGameLanguages,
    hasUkrainianSupport,
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
                // 1. Official Steam Support
                const steamLanguages = await fetchSteamGameLanguages(appId);
                if (!cancelled && steamLanguages && hasUkrainianSupport(steamLanguages)) {
                    const result: BadgeStatus = "OFFICIAL";
                    setStatus(result);
                    setUrl(null);
                    cache[appId] = { timestamp: Date.now(), status: result };
                    setCache(cache);
                    setLoading(false);
                    return;
                }

                // 2. Kuli Community Support
                if (appName) {
                    try {
                        const response = await callBackend<{ status: string; url: string }>("get_kuli_status", appName);
                        if (!cancelled && response && (response.status === "OFFICIAL" || response.status === "COMMUNITY")) {
                            const bStatus = response.status as BadgeStatus;
                            const bUrl = response.url;
                            setStatus(bStatus);
                            setUrl(bUrl);
                            cache[appId] = { timestamp: Date.now(), status: bStatus, url: bUrl };
                            setCache(cache);
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.error(`[decky-ukr-badge] Backend status fetch failed for ${appName}:`, e);
                    }
                }

                // 3. Fallback to NONE
                if (!cancelled) {
                    setStatus("NONE");
                    setUrl(null);
                    cache[appId] = { timestamp: Date.now(), status: "NONE" };
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
