// decky-ukr-badge/src/patches/StorePatch.ts
import { fetchNoCors } from '@decky/api'
import { findModuleExport } from '@decky/ui'
import { BehaviorSubject } from 'rxjs'
import { SettingsContext } from '../hooks/useSettings'

const FETCH_TIMEOUT_MS = 2000

// Helper function to add timeout to fetch requests
async function fetchWithTimeout(
    fetchPromise: Promise<Response>,
    timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })
    return Promise.race([fetchPromise, timeoutPromise])
}

// Store app ID observable - components can subscribe to this
export const storeAppId$ = new BehaviorSubject<string>('')

// Tier colors matching the library badge (for fallback if needed)
const BADGE_COLORS = {
    OFFICIAL: { bg: '#28a745', text: '#ffffff' },
    COMMUNITY: { bg: '#ffc107', text: '#000000' },
    NONE: { bg: '#dc3545', text: '#ffffff' },
    PENDING: { bg: '#666666', text: '#ffffff' }
}

// Track if we're currently in the store
let isStoreMounted = false
let storeWebSocket: WebSocket | null = null
let historyUnlisten: (() => void) | null = null
let messageId = 1

interface Tab {
    id: string
    url: string
    webSocketDebuggerUrl: string
}

// Find Steam's internal history object
const HistoryModule = findModuleExport((exp: any) => exp?.m_history !== undefined)
const History = HistoryModule?.m_history

// Track if WebSocket is ready for injection
let wsReady = false

// Inject badge into store page via WebSocket debugger
async function injectBadgeIntoStore(appId: string) {
    // Check if store badge is enabled in settings
    if (!SettingsContext.value.showOnStore) {
        return
    }

    if (!storeWebSocket || storeWebSocket.readyState !== WebSocket.OPEN || !wsReady) {
        return
    }

    // NOTE: We need to get the status from our own logic, but we can't easily import utils here due to context
    // So we'll inject a script that fetches the status from Kuli directly inside the store page context
    // OR we fetch here and inject the result.
    // Given we are in the Decker plugin context, we can use our backend.

    // However, simpler approach first: Inject a script that adds the container, 
    // and we'll handle the logic in the script or pass data.

    // For now, let's use the Kuli API directly from the injected script to avoid complex bridging
    // Or fetch here since we have fetchNoCors ?
    // Actually, we can just use our utils if we import them? 
    // But wait, this runs in React context, utils run in React context too.

    // We need to fetch the status for THIS appId/GameName.
    // Getting Game Name from AppID is hard without backend.
    // Let's rely on backend call being available via decky-api in the store? No, store is isolated.

    // Strategy:
    // 1. Fetch game name/status here in Plugin context using Decky Backend.
    // 2. Inject the resulting badge HTML into the Store Page.

    // Problem: We need the Game Name for Kuli. AppID isn't enough for Kuli URL.
    // We can fetch Steam Store API to get the name?

    try {
        // 1. Get Game Name from Steam API
        const steamResp = await fetchWithTimeout(fetchNoCors(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`));
        const steamData = await steamResp.json();

        if (!steamData[appId]?.success) return;

        const gameName = steamData[appId].data.name;
        const languages = steamData[appId].data.supported_languages || "";

        const hasUkr = languages.toLowerCase().includes("ukrainian");

        let status = "NONE";
        if (hasUkr) status = "OFFICIAL";
        else {
            // Check Kuli
            const kuliSlug = gameName.toLowerCase().replace(/[':’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").trim().replace(/^-+|-+$/g, "");
            const kuliResp = await fetchWithTimeout(fetchNoCors(`https://kuli.com.ua/${kuliSlug}`));

            if (kuliResp.ok) {
                const kuliHtml = await kuliResp.text();
                if (kuliHtml.includes("item__instruction-main")) status = "COMMUNITY";
                else if (kuliHtml.includes("html-product-details-page")) status = "OFFICIAL";
            }
        }

        const config = BADGE_COLORS[status as keyof typeof BADGE_COLORS] || BADGE_COLORS.NONE;

        // Use localized labels (simplified: "Official", "Community", "None")
        const lang = (navigator.language || "en").startsWith("uk") ? "uk" : "en";
        const labels = {
            OFFICIAL: lang === "uk" ? "Офіційна" : "Official",
            COMMUNITY: lang === "uk" ? "Спільнота" : "Community",
            NONE: lang === "uk" ? "Відсутня" : "None"
        };

        const label = labels[status as keyof typeof labels] || labels.NONE;
        const icon = "🇺🇦";

        const { storeOffsetX, storeOffsetY } = SettingsContext.value;

        // Inject badge into store page
        const injectScript = `
        (function() {
          const existing = document.getElementById('ukr-store-badge');
          if (existing) existing.remove();
    
          const badge = document.createElement('div');
          badge.id = 'ukr-store-badge';
          badge.title = 'Ukrainian Localization Status: ${label}';
          
          function updatePosition() {
            const hasProtonDB = !!document.querySelector('[id*="protondb-store-badge"]');
            
            // Logic: If slider is not zero, use slider directly.
            // If slider is zero, use smart default (20 or 60).
            let finalY = ${storeOffsetY};
            if (finalY === 0) {
              finalY = hasProtonDB ? 80 : 20;
            }
            
            badge.style.bottom = finalY + 'px';
          }

          // Initial position
          updatePosition();
          
          // Monitoring loop for 2 seconds to catch late-loading ProtonDB badge
          let checks = 0;
          const posInterval = setInterval(() => {
            updatePosition();
            checks++;
            if (checks > 20) clearInterval(posInterval);
          }, 100);
          
          badge.style.cssText += 'position: fixed; left: calc(50% + ${storeOffsetX}px); transform: translateX(-50%); z-index: 999999; background: ${config.bg}; padding: 6px 12px; border-radius: 8px; color: ${config.text}; cursor: pointer; display: flex; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: "Motiva Sans", sans-serif; font-weight: bold; transition: all 0.3s ease;';
          badge.innerHTML = '<span style="font-size: 20px; line-height: 1;">${icon}</span><span style="margin-left: 8px; font-size: 14px;">${label}</span>';
          badge.onclick = function() { window.open('https://kuli.com.ua/${gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}', '_blank'); };
          document.body.appendChild(badge);
        })();
      `;

        storeWebSocket.send(JSON.stringify({
            id: messageId++,
            method: 'Runtime.evaluate',
            params: { expression: injectScript }
        }))

    } catch (e) {
        console.error("[UA Badge] Store Injection Error", e);
    }
}

// Remove badge from store page
function removeBadgeFromStore() {
    if (!storeWebSocket || storeWebSocket.readyState !== WebSocket.OPEN) {
        return
    }

    const removeScript = `
    (function() {
      const badge = document.getElementById('ukr-store-badge');
      if (badge) badge.remove();
    })();
  `;

    storeWebSocket.send(JSON.stringify({
        id: messageId++,
        method: 'Runtime.evaluate',
        params: { expression: removeScript }
    }))
}

// Extract app ID from Steam store URL - only from app pages
function extractAppIdFromUrl(url: string): string {
    // Only match URLs that are specifically app pages
    if (!url.includes('https://store.steampowered.com/app/')) {
        return ''
    }
    const match = url.match(/\/app\/([\d]+)\/?/)
    return match?.[1] ?? ''
}

// Update the app ID from URL
function updateAppIdFromUrl(url: string) {
    const appId = extractAppIdFromUrl(url)
    if (storeAppId$.value !== appId) {
        storeAppId$.next(appId)

        // Inject or remove badge based on app ID
        if (appId) {
            injectBadgeIntoStore(appId)
        } else {
            removeBadgeFromStore()
        }
    }
}

// Connect to Chrome WebSocket debugger to listen for store navigation
async function connectToStoreDebugger(retries = 3): Promise<void> {
    if (retries <= 0 || !isStoreMounted) {
        return
    }

    try {
        // Fetch available browser tabs from debugger port
        const response = await fetchNoCors('http://localhost:8080/json')
        const tabs: Tab[] = await response.json()

        // Find the Steam store tab
        const storeTab = tabs.find((tab) => tab.url.includes('store.steampowered.com'))

        if (!storeTab) {
            // Store tab not found, retry after delay
            setTimeout(() => connectToStoreDebugger(retries - 1), 1000)
            return
        }

        // Initial app ID from current URL
        updateAppIdFromUrl(storeTab.url)

        // Connect to WebSocket debugger
        storeWebSocket = new WebSocket(storeTab.webSocketDebuggerUrl)

        storeWebSocket.onopen = (event) => {
            const ws = event.target as WebSocket
            // Enable page events to receive navigation notifications
            ws.send(JSON.stringify({ id: messageId++, method: 'Page.enable' }))
            // Enable runtime for script injection
            ws.send(JSON.stringify({ id: messageId++, method: 'Runtime.enable' }))

            // Mark WebSocket as ready after a short delay for Runtime to initialize
            setTimeout(() => {
                wsReady = true
                // Inject badge for initial URL if we have an app ID
                const currentAppId = storeAppId$.value
                if (currentAppId) {
                    injectBadgeIntoStore(currentAppId)
                }
            }, 300)
        }

        storeWebSocket.onmessage = (event) => {
            if (!isStoreMounted) return

            try {
                const data = JSON.parse(event.data)
                // Listen for frame navigation events
                if (data.method === 'Page.frameNavigated' && data.params?.frame?.url) {
                    // Delay injection to let the page load
                    setTimeout(() => {
                        updateAppIdFromUrl(data.params.frame.url)
                    }, 500)
                }
            } catch (e) {
                // Silently ignore parse errors
            }
        }

        storeWebSocket.onerror = () => {
            if (isStoreMounted) {
                setTimeout(() => connectToStoreDebugger(retries - 1), 1000)
            }
        }

        storeWebSocket.onclose = () => {
            storeWebSocket = null
            wsReady = false
            // Reconnect if still mounted
            if (isStoreMounted) {
                setTimeout(() => connectToStoreDebugger(retries), 1000)
            }
        }
    } catch (e) {
        if (isStoreMounted) {
            setTimeout(() => connectToStoreDebugger(retries - 1), 1000)
        }
    }
}

// Disconnect from WebSocket debugger
function disconnectStoreDebugger() {
    // Remove badge before disconnecting
    removeBadgeFromStore()

    isStoreMounted = false
    wsReady = false
    storeAppId$.next('')

    if (storeWebSocket) {
        storeWebSocket.close()
        storeWebSocket = null
    }
}

// Handle location changes in Steam's router
function handleLocationChange(pathname: string) {
    if (pathname === '/steamweb') {
        // User entered the store view
        isStoreMounted = true
        connectToStoreDebugger()
    } else if (isStoreMounted) {
        // User left the store view
        disconnectStoreDebugger()
    }
}

// Initialize store patching
export function initStorePatch(): () => void {
    if (!History) {
        return () => { }
    }

    // Check initial location
    handleLocationChange(History.location?.pathname || '')

    // Listen for route changes
    historyUnlisten = History.listen((info: { pathname: string }) => {
        handleLocationChange(info.pathname)
    })

    // Return cleanup function
    return () => {
        if (historyUnlisten) {
            historyUnlisten()
            historyUnlisten = null
        }
        disconnectStoreDebugger()
    }
}
