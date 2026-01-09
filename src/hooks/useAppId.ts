// decky-ukr-badge/src/hooks/useAppId.ts
import { useEffect, useState } from "react";
import { useParams } from "./useParams";

// Declare appStore for TypeScript
declare const appStore: {
    GetAppOverviewByGameID: (id: number) => {
        appid: number;
        display_name: string;
        app_type: number;
    } | null;
};

// Steam app types that are actual games
const STEAM_GAME_TYPES: Record<number, boolean> = {
    1: true, // Game
    2: true, // Application
    4: true, // Tool
    8: true, // Demo
    16: true, // Deprecated
    32: true, // DLC
    64: true, // Guide
    128: true, // Driver
    256: true, // Config
    512: true, // Hardware
    1024: true, // Franchise
    2048: true, // Video
    4096: true, // Plugin
    8192: true, // Music
    16384: true, // Series
    32768: true, // Comic
    65536: true, // Beta
};

/**
 * Hook to get the current app ID from the route.
 * Returns the app ID and display name of the current game/app.
 */
export function useAppId(): {
    appId: string | undefined;
    appName: string;
    isLoading: boolean;
} {
    const [appId, setAppId] = useState<string | undefined>();
    const [appName, setAppName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const { appid: pathId } = useParams<{ appid: string }>();

    useEffect(() => {
        let ignore = false;

        async function resolveAppId() {
            if (!pathId) {
                setIsLoading(false);
                return;
            }

            try {
                const appDetails = appStore.GetAppOverviewByGameID(
                    parseInt(pathId, 10)
                );

                if (ignore) return;

                if (!appDetails) {
                    console.warn(
                        "[decky-ukr-badge] Could not get app details for:",
                        pathId
                    );
                    setAppId(pathId);
                    setIsLoading(false);
                    return;
                }

                const isSteamGame = Boolean(
                    STEAM_GAME_TYPES[appDetails.app_type]
                );

                if (isSteamGame) {
                    setAppId(pathId);
                    setAppName(appDetails.display_name || "");
                } else {
                    // Non-Steam game - still use the pathId but we have the name
                    setAppId(pathId);
                    setAppName(appDetails.display_name || "");
                }
            } catch (error) {
                console.error(
                    "[decky-ukr-badge] Error getting app details:",
                    error
                );
                setAppId(pathId);
            }

            if (!ignore) {
                setIsLoading(false);
            }
        }

        setIsLoading(true);
        resolveAppId();

        return () => {
            ignore = true;
        };
    }, [pathId]);

    return { appId, appName, isLoading };
}

export default useAppId;
