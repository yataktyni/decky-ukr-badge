// decky-ukr-badge/src/hooks/useSettings.ts
import { call } from "@decky/api";
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

// Helper function to call backend - Decky uses positional args
export async function callBackend<T>(
    method: string,
    ...args: unknown[]
): Promise<T> {
    console.log(`[decky-ukr-badge] Calling backend: ${method}`, args);
    try {
        const result = await call(method, ...args);
        console.log(
            `[decky-ukr-badge] Backend response for ${method}:`,
            result,
        );
        return result as T;
    } catch (error) {
        console.error(
            `[decky-ukr-badge] Backend call ${method} failed:`,
            error,
        );
        throw error;
    }
}

export type Settings = {
    badgeType: "full" | "default";
    badgePosition: "top-left" | "top-right";
    offsetX: number;
    offsetY: number;
};

// Default settings
const DEFAULT_SETTINGS: Settings = {
    badgeType: "full",
    badgePosition: "top-right",
    offsetX: 10,
    offsetY: 10,
};

// Reactive state using BehaviorSubject (not using React context for simplicity)
const SettingsContext = new BehaviorSubject<Settings>(DEFAULT_SETTINGS);
const LoadingContext = new BehaviorSubject<boolean>(true);

/**
 * Update a single setting and persist to backend
 */
function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const oldSettings = SettingsContext.value;
    const newSettings = { ...oldSettings, [key]: value };
    SettingsContext.next(newSettings);

    // Persist to backend with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Settings save timeout after 2000ms")), 2000);
    });

    Promise.race([
        call("set_settings", key, value),
        timeoutPromise,
    ])
        .then((success) => {
            if (success === false) {
                console.error("[decky-ukr-badge] Backend rejected setting save");
                // Revert to previous value on save failure
                SettingsContext.next(oldSettings);
            }
        })
        .catch((error) => {
            console.error("[decky-ukr-badge] Failed to save setting:", error);
            // Revert to previous value on save failure
            SettingsContext.next(oldSettings);
        });
}

/**
 * Load settings from backend - call this at plugin init
 */
export function loadSettings() {
    LoadingContext.next(true);
    console.log("[decky-ukr-badge] Loading settings...");

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Settings load timeout after 3000ms")), 3000);
    });

    Promise.race([
        call<[], Settings>("get_settings"),
        timeoutPromise,
    ])
        .then((settings) => {
            console.log("[decky-ukr-badge] Loaded settings:", settings);
            if (settings && typeof settings === "object") {
                SettingsContext.next({ ...DEFAULT_SETTINGS, ...settings });
            } else {
                // Fallback to defaults if response is invalid
                SettingsContext.next(DEFAULT_SETTINGS);
            }
        })
        .catch((error) => {
            console.error("[decky-ukr-badge] Failed to load settings:", error);
            // Use defaults on error
            SettingsContext.next(DEFAULT_SETTINGS);
        })
        .finally(() => {
            LoadingContext.next(false);
        });
}

/**
 * Hook to access and update settings
 */
export function useSettings() {
    const [settings, setSettings] = useState(SettingsContext.value);
    const [loading, setLoading] = useState(LoadingContext.value);

    useEffect(() => {
        // Subscribe to settings changes
        const settingsSub = SettingsContext.asObservable().subscribe(
            (value) => {
                setSettings(value);
            },
        );

        // Subscribe to loading state changes
        const loadingSub = LoadingContext.asObservable().subscribe((value) => {
            setLoading(value);
        });

        return () => {
            settingsSub.unsubscribe();
            loadingSub.unsubscribe();
        };
    }, []);

    // Update functions
    function setBadgeType(value: Settings["badgeType"]) {
        updateSetting("badgeType", value);
    }

    function setBadgePosition(value: Settings["badgePosition"]) {
        updateSetting("badgePosition", value);
    }

    function setOffsetX(value: Settings["offsetX"]) {
        updateSetting("offsetX", value);
    }

    function setOffsetY(value: Settings["offsetY"]) {
        updateSetting("offsetY", value);
    }

    return {
        settings,
        loading,
        setBadgeType,
        setBadgePosition,
        setOffsetX,
        setOffsetY,
    };
}

// Export for direct access if needed
export { SettingsContext, DEFAULT_SETTINGS };
