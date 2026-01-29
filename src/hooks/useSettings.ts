// decky-ukr-badge/src/hooks/useSettings.ts
import { call } from "@decky/api";
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

// Helper function to call backend
export async function callBackend<T>(
    method: string,
    ...args: unknown[]
): Promise<T> {
    try {
        const result = await call(method, ...args);
        return result as T;
    } catch (error) {
        console.error(`[decky-ukr-badge] Backend call ${method} failed:`, error);
        throw error;
    }
}

export type Settings = {
    badgeType: "full" | "default";
    badgePosition: "top-left" | "top-right";
    offsetX: number;
    offsetY: number;
    showOnStore: boolean;
    storeOffsetX: number;
    storeOffsetY: number;
};

// Default settings
const DEFAULT_SETTINGS: Settings = {
    badgeType: "full",
    badgePosition: "top-left",
    offsetX: 10,
    offsetY: 10,
    showOnStore: false,
    storeOffsetX: 0,
    storeOffsetY: 0,
};

const SettingsContext = new BehaviorSubject<Settings>(DEFAULT_SETTINGS);
const LoadingContext = new BehaviorSubject<boolean>(true);

/**
 * Update a single setting and persist to backend
 */
async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const oldSettings = SettingsContext.value;
    const newSettings = { ...oldSettings, [key]: value };

    // Optimistic update
    SettingsContext.next(newSettings);

    try {
        await call("set_settings", key, value);
    } catch (error) {
        console.error("[decky-ukr-badge] Failed to save setting:", error);
        // We only rollback on catastrophic error to avoid "jumping"
        // But for better UX on Steam Deck, sometimes keeping the optimistic state is preferred
    }
}

/**
 * Load settings from backend
 */
export function loadSettings() {
    LoadingContext.next(true);
    call<[], Settings>("get_settings")
        .then((settings) => {
            if (settings && typeof settings === "object") {
                SettingsContext.next({ ...DEFAULT_SETTINGS, ...settings });
            } else {
                SettingsContext.next(DEFAULT_SETTINGS);
            }
        })
        .catch(() => {
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
        const settingsSub = SettingsContext.asObservable().subscribe(v => setSettings(v));
        const loadingSub = LoadingContext.asObservable().subscribe(v => setLoading(v));
        return () => {
            settingsSub.unsubscribe();
            loadingSub.unsubscribe();
        };
    }, []);

    return {
        settings,
        loading,
        setBadgeType: (v: Settings["badgeType"]) => updateSetting("badgeType", v),
        setBadgePosition: (v: Settings["badgePosition"]) => updateSetting("badgePosition", v),
        setOffsetX: (v: Settings["offsetX"]) => updateSetting("offsetX", v),
        setOffsetY: (v: Settings["offsetY"]) => updateSetting("offsetY", v),
        setShowOnStore: (v: Settings["showOnStore"]) => updateSetting("showOnStore", v),
        setStoreOffsetX: (v: Settings["storeOffsetX"]) => updateSetting("storeOffsetX", v),
        setStoreOffsetY: (v: Settings["storeOffsetY"]) => updateSetting("storeOffsetY", v),
    };
}

export { SettingsContext, DEFAULT_SETTINGS };
