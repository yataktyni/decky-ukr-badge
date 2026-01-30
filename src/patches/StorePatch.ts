// decky-ukr-badge/src/patches/StorePatch.ts
import { fetchNoCors } from '@decky/api'
import { findModuleExport } from '@decky/ui'
import { BehaviorSubject } from 'rxjs'
import { SettingsContext } from '../hooks/useSettings'
import { urlifyGameName } from '../utils'

const FETCH_TIMEOUT_MS = 5000

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

async function searchKuli(gameName: string): Promise<{ status: string, slug: string } | null> {
    try {
        const searchUrl = `https://kuli.com.ua/games?query=${encodeURIComponent(gameName)}`;
        const headers = {
            "Accept": "text/html",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };

        const res = await fetchWithTimeout(fetchNoCors(searchUrl, { headers }));
        if (res.status !== 200) return null;

        const html = await res.text();

        // Regex strategies (matching Python logic)
        // 1. Standard product item
        let match = html.match(/class="product-item[^"]*".*?href="([^"]+)"/s);

        // 2. Full product item
        if (!match) match = html.match(/class="product-item-full[^"]*".*?href="([^"]+)"/s);

        // 3. Grid item
        if (!match) match = html.match(/class="item-grid".*?href="([^"]+)"/s);

        if (!match) return null;

        let href = match[1];
        // Clean up URL
        if (href.startsWith("/")) {
            href = href.substring(1); // remove leading slash
        }
        // If it starts with full url, strip domain to get slug
        if (href.startsWith("https://kuli.com.ua/")) {
            href = href.replace("https://kuli.com.ua/", "");
        }

        const slug = href;
        const fullUrl = `https://kuli.com.ua/${slug}`;

        // Verify
        const gameRes = await fetchWithTimeout(fetchNoCors(fullUrl, { headers }));
        if (gameRes.status !== 200) return null;

        const gameHtml = await gameRes.text();
        if (gameHtml.includes("item__instruction-main")) return { status: "COMMUNITY", slug };
        if (gameHtml.includes("html-product-details-page") || gameHtml.includes("game-page") || gameHtml.includes("item__title"))
            return { status: "OFFICIAL", slug };

        return null;
    } catch (e) {
        console.warn("[decky-ukr-badge] Store Patch Search Error:", e);
        return null;
    }
}

// Store app ID observable - components can subscribe to this
export const storeAppId$ = new BehaviorSubject<string>('')

// Tier colors and shadows matching the library badge
const BADGE_COLORS = {
    OFFICIAL: { bg: '#28a745', text: '#ffffff', shadow: 'rgba(40, 167, 69, 0.4)' },
    COMMUNITY: { bg: '#ffc107', text: '#000000', shadow: 'rgba(255, 193, 7, 0.4)' },
    NONE: { bg: '#dc3545', text: '#ffffff', shadow: 'rgba(220, 53, 69, 0.4)' },
    PENDING: { bg: '#666666', text: '#ffffff', shadow: 'rgba(102, 102, 102, 0.4)' }
}

const ICONS = {
    OFFICIAL: '<svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor" style="display:inline-block;vertical-align:middle;"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.248-16.379-6.248-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.248 16.379 6.248 22.628 0z"/></svg>',
    COMMUNITY: '<svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor" style="display:inline-block;vertical-align:middle;"><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"/></svg>',
    NONE: '<svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor" style="display:inline-block;vertical-align:middle;"><path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm84.426 312.441c4.7 4.7 4.7 12.312 0 17.012l-10.118 10.119c-4.7 4.7-12.312 4.7-17.012 0L256 289.426l-57.296 57.297c-4.7 4.7-12.312 4.7-17.012 0l-10.118-10.119c-4.7-4.7-4.7-12.312 0-17.012L228.872 256l-57.297-57.296c-4.7-4.7-4.7-12.312 0-17.012l10.118-10.119c4.7-4.7 12.312-4.7 17.012 0L256 222.574l57.296-57.297c4.7-4.7 12.312-4.7 17.012 0l10.118 10.119c4.7 4.7 4.7 12.312 0 17.012L283.128 256l57.298 57.441z"/></svg>'
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

    console.log(`[UA Badge] Injecting badge for AppID: ${appId}`);
    try {
        // 1. Get Game Name from Steam API
        console.log(`[UA Badge] Fetching Steam API for ${appId}`);
        const steamResp = await fetchWithTimeout(fetchNoCors(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`));
        const steamData = await steamResp.json();

        if (!steamData[appId]?.success) {
            console.warn(`[UA Badge] Steam API failed for ${appId}`, steamData);
            return;
        }

        const gameName = steamData[appId].data.name;
        console.log(`[UA Badge] Game Name: ${gameName}`);
        const languages = steamData[appId].data.supported_languages || "";

        const hasUkr = languages.toLowerCase().includes("ukrainian");

        let status = "NONE";
        let confirmedOnKuli = false;
        let kuliSlug = urlifyGameName(gameName);
        let kuliStatusFromHtml: string | null = null;

        // 1. Check Kuli (Always, for clickability)
        try {
            const headers = {
                "Accept": "text/html",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            };

            let kuliResp = await fetchWithTimeout(fetchNoCors(`https://kuli.com.ua/${kuliSlug}`, { headers }));

            if (kuliResp.ok) {
                confirmedOnKuli = true;
                const kuliHtml = await kuliResp.text();
                // Extract status regardless (will only use if Steam didn't confirm)
                if (kuliHtml.includes("item__instruction-main")) kuliStatusFromHtml = "COMMUNITY";
                else if (kuliHtml.includes("html-product-details-page")) kuliStatusFromHtml = "OFFICIAL";
            } else if (kuliResp.status === 404) {
                // Fallback to Search
                console.log(`[decky-ukr-badge] Store: Direct slug failed for ${gameName}, searching...`);
                // Use imported searchKuli, assuming it's available in scope or we fixed the import?
                // Wait, searchKuli is defined in this file. Good.
                const searchResult = await searchKuli(gameName);
                if (searchResult) {
                    kuliStatusFromHtml = searchResult.status;
                    kuliSlug = searchResult.slug;
                    confirmedOnKuli = true;
                }
            }
        } catch (e) {
            console.warn("[decky-ukr-badge] Store Patch Kuli Check Failed:", e);
        }

        // 2. Determine Final Status (Steam overrides Kuli for 'Official' status)
        if (hasUkr) {
            status = "OFFICIAL";
        } else if (confirmedOnKuli && kuliStatusFromHtml) {
            status = kuliStatusFromHtml;
        } else {
            status = "NONE";
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
        const iconSvg = ICONS[status as keyof typeof ICONS] || ICONS.NONE;
        const flag = "🇺🇦";

        const isClickable = confirmedOnKuli;
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
            
            let finalY = ${storeOffsetY};
            if (finalY === 20 || finalY === 0) {
              finalY = hasProtonDB ? 80 : 20;
            }
            
            badge.style.bottom = finalY + 'px';
          }

          updatePosition();
          
          let checks = 0;
          const posInterval = setInterval(() => {
            updatePosition();
            checks++;
            if (checks > 20) clearInterval(posInterval);
          }, 100);
          
          badge.style.cssText += 'position: fixed; left: calc(50% + ${storeOffsetX}px); transform: translateX(-50%); z-index: 999999; background: ${config.bg}; padding: 6px 12px; border-radius: 8px; color: ${config.text}; cursor: ${isClickable ? 'pointer' : 'default'}; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px ${config.shadow}; font-family: "Motiva Sans", sans-serif; font-weight: bold; transition: all 0.3s ease;';
          badge.innerHTML = '<span style="font-size: 20px; line-height: 1;">${flag}</span>${iconSvg}<span style="font-size: 14px;">${label}</span>';
          
          ${isClickable ? `
          badge.onclick = function() { window.open('https://kuli.com.ua/${kuliSlug}', '_blank'); };
          ` : ''}
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
