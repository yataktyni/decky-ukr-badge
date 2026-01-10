import React, { useEffect, useState } from "react";
import Badge from "./Badge";

const StoreOverlay = () => {
    const [appId, setAppId] = useState<string | null>(null);
    const [appName, setAppName] = useState<string>("");
    const [protonDBExists, setProtonDBExists] = useState(false);

    useEffect(() => {
        // Poll for URL changes and ProtonDB badge existence
        const interval = setInterval(() => {
            // Check URL
            // Store URL format: /store/app/<appid> or /shopping/app/<appid>
            const match = window.location.pathname.match(/\/(store|shopping)\/app\/(\d+)/);
            const newAppId = match ? match[2] : null;

            if (newAppId !== appId) {
                setAppId(newAppId);
                setAppName(""); // Reset name on change
            }

            // Check for ProtonDB badge
            const protonBadge = document.getElementById('protondb-store-badge');
            setProtonDBExists(!!protonBadge);

        }, 500);

        return () => clearInterval(interval);
    }, [appId]);

    // Fetch app name when AppID changes
    useEffect(() => {
        if (!appId) return;

        // Try to find name in DOM first (optimization)
        const nameElement = document.querySelector('.apphub_AppName');
        if (nameElement && nameElement.textContent) {
            setAppName(nameElement.textContent);
            return;
        }

        // Fallback to API
        fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data[appId] && data[appId].success) {
                    setAppName(data[appId].data.name);
                }
            })
            .catch(e => console.error("[decky-ukr-badge] Failed to fetch app details:", e));
    }, [appId]);

    if (!appId) return null;

    // We pass appName only if found. If not found, Badge might try to look it up or fail Kuli check.
    // However, Badge logic for Kuli requires appName.
    // If we rely on API, it might take a moment.

    // Custom style for Store Overlay to place it fixed
    // Badge component normally uses absolute positioning relative to container.
    // Here we want Fixed positioning relative to screen.
    // But Badge.tsx applies 'position: absolute' to the container. 
    // We can wrap it? Or Badge accepts style overrides?
    // Badge logic calculates top/left/right based on settings.
    // Store Badge needs specific fixed positioning (bottom center-ish).

    // Current Badge.tsx uses:
    // style={{ position: "absolute", ...position }}
    // If isStore=true, we might want to override this in Badge.tsx?
    // User wants "center right above proton badge".
    // ProtonDB is bottom: 20px, left: 50%.
    // So we want bottom: 60px?, left: 50%?

    // I need to update Badge.tsx to handle Fixed positioning if isStore is true? 
    // Or just let Badge do its thing but render it in a fixed container?
    // If Badge is absolute, putting it in a fixed container works if container is sized 0x0.

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}>
            {/* Render Badge only if we have appName (needed for logic) */}
            {appName && (
                <div style={{ pointerEvents: "auto" }}>
                    <Badge
                        appId={appId}
                        appName={appName}
                        isStore={true}
                        protonDBExists={protonDBExists}
                    />
                </div>
            )}
        </div>
    );
};

export default StoreOverlay;
