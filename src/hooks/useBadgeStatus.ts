// decky-ukr-badge/src/hooks/useBadgeStatus.ts
import { useState, useEffect } from "react";
import {
    fetchSteamGameLanguages,
    fetchKuliTranslationStatus,
    hasUkrainianSupport,
} from "../utils";

export type BadgeStatus = "OFFICIAL" | "COMMUNITY" | "NONE";

interface CacheEntry {
    timestamp: number;
    status: BadgeStatus;
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
                setLoading(false);
                return;
            }

            try {
                // 1. Official Steam Support
                const steamLanguages = await fetchSteamGameLanguages(appId);
                if (!cancelled && steamLanguages && hasUkrainianSupport(steamLanguages)) {
                    const result: BadgeStatus = "OFFICIAL";
                    setStatus(result);
                    cache[appId] = { timestamp: Date.now(), status: result };
                    setCache(cache);
                    setLoading(false);
                    return;
                }

                // 2. Kuli Community Support
                if (appName) {
                    const kuliStatus = await fetchKuliTranslationStatus(appName);
                    if (!cancelled && kuliStatus) {
                        setStatus(kuliStatus);
                        cache[appId] = { timestamp: Date.now(), status: kuliStatus };
                        setCache(cache);
                        setLoading(false);
                        return;
                    }
                }

                // 3. Fallback to NONE
                if (!cancelled) {
                    setStatus("NONE");
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

    return { status, loading };
}
