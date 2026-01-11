import { useState, useEffect } from "react";
import { BehaviorSubject } from "rxjs";

export interface DebugSettings {
    mockMode: boolean;
    mockStatus: "OFFICIAL" | "COMMUNITY" | "NONE";
}

const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
    mockMode: false,
    mockStatus: "OFFICIAL",
};

// Key for localStorage
const DEBUG_SETTINGS_KEY = "decky-ukr-badge-debug-settings";

// Load from localStorage
const loadDebugSettings = (): DebugSettings => {
    try {
        const stored = localStorage.getItem(DEBUG_SETTINGS_KEY);
        if (stored) {
            return { ...DEFAULT_DEBUG_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to load debug settings", e);
    }
    return DEFAULT_DEBUG_SETTINGS;
};

const DebugSettingsSubject = new BehaviorSubject<DebugSettings>(loadDebugSettings());

export function useDebugSettings() {
    const [debugSettings, setDebugSettings] = useState(DebugSettingsSubject.value);

    useEffect(() => {
        const sub = DebugSettingsSubject.subscribe(setDebugSettings);
        return () => sub.unsubscribe();
    }, []);

    const updateDebugSettings = (newSettings: Partial<DebugSettings>) => {
        const updated = { ...DebugSettingsSubject.value, ...newSettings };
        DebugSettingsSubject.next(updated);
        try {
            localStorage.setItem(DEBUG_SETTINGS_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save debug settings", e);
        }
    };

    return {
        debugSettings,
        setMockMode: (mockMode: boolean) => updateDebugSettings({ mockMode }),
        setMockStatus: (mockStatus: DebugSettings["mockStatus"]) => updateDebugSettings({ mockStatus }),
    };
}
