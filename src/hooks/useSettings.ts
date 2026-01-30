// decky-ukr-badge/src/hooks/useSettings.ts
import { call } from "@decky/api";
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

export async function callBackend<T>(method: string, ...args: unknown[]): Promise<T> {
    console.log(`[decky-ukr-badge] callBackend: ${method}`, args);
    try {
        const result = await call(method, ...args);
        return result as T;
    } catch (error) {
        console.error(`[decky-ukr-badge] callBackend error: ${method}`, error);
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

const DEFAULT_SETTINGS: Settings = {
    badgeType: "full",
    badgePosition: "top-right",
    offsetX: 20,
    offsetY: 90,
    showOnStore: true,
    storeOffsetX: 0,
    storeOffsetY: 20,
};

const SettingsContext = new BehaviorSubject<Settings>(DEFAULT_SETTINGS);
const LoadingContext = new BehaviorSubject<boolean>(true);

async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const oldSettings = SettingsContext.value;
    const newSettings = { ...oldSettings, [key]: value };
    SettingsContext.next(newSettings);

    try {
        await Promise.race([
            call("set_settings", key, value),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
        ]);
    } catch (error) {
        console.error("[decky-ukr-badge] Failed to save setting:", error);
    }
}

export function loadSettings() {
    if (!LoadingContext.value && SettingsContext.value !== DEFAULT_SETTINGS) return;

    LoadingContext.next(true);
    console.log("[decky-ukr-badge] Loading settings via call...");

    Promise.race([
        call<[], Settings>("get_settings"),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
    ])
        .then((settings) => {
            console.log("[decky-ukr-badge] Settings received:", settings);
            if (settings && typeof settings === "object") {
                SettingsContext.next({ ...DEFAULT_SETTINGS, ...settings });
            } else {
                SettingsContext.next(DEFAULT_SETTINGS);
            }
        })
        .catch((error) => {
            console.error("[decky-ukr-badge] Settings load failed, using defaults:", error);
            SettingsContext.next(DEFAULT_SETTINGS);
        })
        .finally(() => {
            LoadingContext.next(false);
        });
}

export function useSettings() {
    const [settings, setSettings] = useState(SettingsContext.value);
    const [loading, setLoading] = useState(LoadingContext.value);

    useEffect(() => {
        const sSub = SettingsContext.subscribe(setSettings);
        const lSub = LoadingContext.subscribe(setLoading);
        return () => { sSub.unsubscribe(); lSub.unsubscribe(); };
    }, []);

    return {
        settings, loading,
        setBadgeType: (v: Settings["badgeType"]) => updateSetting("badgeType", v),
        setBadgePosition: (v: Settings["badgePosition"]) => updateSetting("badgePosition", v),
        setOffsetX: (v: Settings["offsetX"]) => updateSetting("offsetX", v),
        setOffsetY: (v: Settings["offsetY"]) => updateSetting("offsetY", v),
        setShowOnStore: (v: Settings["showOnStore"]) => updateSetting("showOnStore", v),
        setStoreOffsetX: (v: Settings["storeOffsetX"]) => updateSetting("storeOffsetX", v),
        setStoreOffsetY: (v: Settings["storeOffsetY"]) => updateSetting("storeOffsetY", v),
    };
}

export { SettingsContext };
