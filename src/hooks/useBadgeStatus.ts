// decky-ukr-badge/src/hooks/useBadgeStatus.ts
import { useState, useEffect } from "react";
import { fetchNoCors } from "@decky/api";
import { callBackend } from "./useSettings";
import {
    cleanNonSteamName,
    searchKuli,
    fetchWithTimeout,
} from "../utils";
import { logger } from "../logger";

const log = logger.component("useBadgeStatus");

export type BadgeStatus = "OFFICIAL" | "COMMUNITY" | "NONE";

/**
 * Hook to manage fetching of Ukrainian localization status
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

            try {
                let currentAppName = cleanNonSteamName(appName || "");
                const isSteamId = appId && (parseInt(appId) < 1000000000);

                let steamStatus: BadgeStatus | null = null;
                let storeName: string | null = null;

                if (!isSteamId) {
                    log.info(`Non-Steam game detected: ${currentAppName} (${appId})`);
                }

                // 1. Aggressive Store Metadata Check (Primary for Steam games)
                if (isSteamId) {
                    try {
                        // Match StorePatch.ts fetching logic precisely
                        const steamResp = await fetchWithTimeout(fetchNoCors(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`), 10000);
                        const steamData = await steamResp.json();

                        if (steamData && steamData[appId]?.success) {
                            storeName = steamData[appId].data.name;
                            currentAppName = storeName || currentAppName;
                            const languages = steamData[appId].data.supported_languages || "";
                            if (languages.toLowerCase().includes("ukrainian")) {
                                steamStatus = "OFFICIAL";
                            }
                        }
                    } catch (e) {
                        log.warn(`Store metadata fetch failed for ${appId}:`, e);
                    }
                }

                // 2. Kuli Community Support (via consolidated searchKuli)
                let kuliStatus: BadgeStatus | null = null;
                let kuliUrl: string | null = null;

                // Priority: Steam Store Name > Initial appName
                const searchName = storeName || currentAppName;

                if (!cancelled && searchName) {
                    log.info(`Resolving Kuli for: ${searchName} (AppID: ${appId})`);
                    try {
                        const response = await searchKuli(searchName);
                        if (!cancelled && response) {
                            kuliStatus = response.status as BadgeStatus;
                            kuliUrl = `https://kuli.com.ua/${response.slug}`;
                        }
                    } catch (e) {
                        log.error(`Kuli resolution failed for ${searchName}:`, e);
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

                if (!cancelled) {
                    setStatus(finalStatus);
                    setUrl(finalUrl);
                }

            } catch (e) {
                log.error("Status fetch failed:", e);
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
