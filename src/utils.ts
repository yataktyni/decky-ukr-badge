// decky-ukr-badge/src/utils.ts
import { Router } from "@decky/ui";
import { call } from "@decky/api";
import { fetchNoCors } from "@decky/api";
import { logger } from "./logger";
import { callBackend } from "./hooks/useSettings";

const log = logger.component("utils");

/**
 * Gets the current game's App ID from Steam Deck's navigation.
 * Returns null if not on a game page or no app is available.
 */
export function getGameId(): string | null {
    try {
        // Try to get from the running app
        const runningApp = Router.MainRunningApp;
        if (runningApp?.appid) {
            return String(runningApp.appid);
        }

        // Try to get from current route params
        const pathname = window.location.pathname;
        const match = pathname.match(/\/routes\/appdetails\/(\d+)/) ||
            pathname.match(/\/store\/app\/(\d+)/) ||
            pathname.match(/\/shopping\/app\/(\d+)/);
        if (match) {
            return match[1];
        }

        return null;
    } catch (e) {
        log.error("Error getting game ID:", e);
        return null;
    }
}

/**
 * Gets the current game's display name.
 * Returns null if not available.
 */
export function getGameName(): string | null {
    try {
        const runningApp = Router.MainRunningApp;
        if (runningApp?.display_name) {
            return runningApp.display_name;
        }
        return null;
    } catch (e) {
        log.error("Error getting game name:", e);
        return null;
    }
}

/**
 * Cleans a game name by removing common non-Steam tags and versions.
 */
export function cleanNonSteamName(name: string): string {
    if (!name) return "";
    return name
        .replace(/\s*\((Shortcut|Non-Steam|App|Game)\)$/i, "")
        .replace(/\s*v\d+(\.\d+)*/i, "")
        .trim();
}

/**
 * Converts a game name to a URL-friendly format for kuli.com.ua
 */
export function urlifyGameName(name: string): string {
    const cleaned = cleanNonSteamName(name);
    return cleaned
        .toLowerCase()
        .replace(/[':’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .replace(/^-+|-+$/g, "");
}

// Opens a URL in Steam's built-in browser.
export function openInSteamBrowser(url: string): void {
    try {
        // Use Steam's navigation to open external URLs
        if (
            typeof SteamClient !== "undefined" &&
            SteamClient.System?.OpenInSystemBrowser
        ) {
            SteamClient.System.OpenInSystemBrowser(url);
        } else {
            // Fallback
            window.open(url, "_blank");
        }
    } catch (e) {
        log.error("Error opening URL:", e);
        window.open(url, "_blank");
    }
}

/**
 * Gets the Steam client's UI language.
 */
export function getSteamLanguage(): string {
    try {
        // Try to get Steam's UI language
        if (
            typeof SteamClient !== "undefined" &&
            SteamClient.Settings?.GetClientSettings
        ) {
            // NOTE: We could extract language from GetClientSettings here in future
        }

        // Fallback to navigator language
        const lang = navigator.language?.toLowerCase() || "en";
        if (lang.startsWith("uk")) {
            return "uk";
        }
        return "en";
    } catch {
        return "en";
    }
}

// Declare SteamClient for TypeScript
declare const SteamClient:
    | {
        System?: {
            OpenInSystemBrowser?: (url: string) => void;
        };
        Settings?: {
            GetClientSettings?: () => unknown;
        };
    }
    | undefined;

const FETCH_TIMEOUT_MS = 5000;

// Helper function to add timeout to fetch requests
export async function fetchWithTimeout(
    fetchPromise: Promise<Response>,
    timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })
    return Promise.race([fetchPromise, timeoutPromise])
}

// Helper for Levenshtein distance
function levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

export async function searchKuli(gameName: string): Promise<{ status: string, slug: string } | null> {
    if (!gameName) return null;
    try {
        const headers = {
            "Accept": "text/html",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };

        // Helper: detect if response is a valid game page (not 404/redirect)
        const isValidGamePage = (html: string): boolean => {
            // Kuli 404 pages redirect to /page-not-found or contain specific error markers
            if (html.includes('page-not-found') ||
                html.includes('Сторінку не знайдено') ||
                html.includes('404')) {
                return false;
            }
            // Valid game pages have product details
            return html.includes('html-product-details-page') ||
                html.includes('product-essential') ||
                html.includes('item__instruction-main');
        };

        // Helper: determine status from page HTML
        const getStatusFromHtml = (html: string): string => {
            if (html.includes("item__instruction-main")) return "COMMUNITY";
            return "OFFICIAL";
        };

        // 1. Try DIRECT LINK first (Parity with StorePatch logic)
        const directSlug = urlifyGameName(gameName);
        const directUrl = `https://kuli.com.ua/${directSlug}`;
        log.info(`Trying direct Kuli link: ${directUrl}`);

        try {
            const directRes = await fetchWithTimeout(fetchNoCors(directUrl, { headers }), 10000);
            const directHtml = await directRes.text();

            if (isValidGamePage(directHtml)) {
                log.info(`Direct link HIT for ${gameName} -> ${directSlug}`);
                return { status: getStatusFromHtml(directHtml), slug: directSlug };
            } else {
                log.info(`Direct link MISS for ${directSlug} (404 or redirect)`);
            }
        } catch (e) {
            log.warn(`Direct check failed for ${directSlug}:`, e);
        }

        // 2. Fallback to SEARCH
        log.info(`Searching Kuli for: ${gameName}`);
        const searchUrl = `https://kuli.com.ua/games?query=${encodeURIComponent(gameName)}`;
        const res = await fetchWithTimeout(fetchNoCors(searchUrl, { headers }), 10000);

        const html = await res.text();
        const results: { slug: string; title: string; score: number }[] = [];

        // Parse product items - Kuli uses <a href="/slug"> with nested product-title
        // Match pattern: href="/slug" followed by product-title class with title text
        const productItemRegex = /<a[^>]+href="\/([a-z0-9-]+)"[^>]*class="[^"]*product-item[^"]*"[^>]*>[\s\S]*?<(?:h2|div)[^>]*class="[^"]*product-title[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*product-title-wrapper[^"]*"[^>]*>\s*([^<]+)/gi;

        let match;
        while ((match = productItemRegex.exec(html)) !== null) {
            const slug = match[1];
            const title = match[2].trim();

            if (!title || !slug || results.some(r => r.slug === slug)) continue;

            const gLow = gameName.toLowerCase().trim();
            const tLow = title.toLowerCase().trim();
            const sLow = slug.toLowerCase();

            // Calculate match score (lower is better)
            let score = levenshtein(gLow, tLow);

            // Exact match bonuses
            if (tLow === gLow) score = 0;
            else if (sLow === directSlug) score = 0; // Slug exact match

            // Penalize extended names (e.g., "House Flipper 2" when searching "House Flipper")
            // If game title STARTS with search term but has more (sequel/DLC), penalize
            if (tLow.startsWith(gLow) && tLow.length > gLow.length) {
                const extra = tLow.substring(gLow.length).trim();
                // If the extra part looks like a sequel/version (number, colon, etc.)
                if (/^[\s:0-9-]+/.test(extra)) {
                    score += 50; // Heavy penalty for sequels
                }
            }

            // Boost if search term contains the title exactly
            if (gLow.includes(tLow) || tLow.includes(gLow)) {
                score = Math.min(score, 5);
            }

            results.push({ slug, title, score });
            log.info(`Search result: "${title}" (${slug}) score=${score}`);
        }

        // Fallback regex for simpler HTML structure
        if (results.length === 0) {
            const simpleRegex = /href="\/([a-z0-9-]+)"[^>]*>[\s\S]*?class="product-title[^"]*"[^>]*>[\s\S]*?([^<]+)</gi;
            while ((match = simpleRegex.exec(html)) !== null) {
                const slug = match[1];
                const title = match[2].trim();

                if (!title || !slug || slug === 'games' || slug === '' || results.some(r => r.slug === slug)) continue;

                const gLow = gameName.toLowerCase().trim();
                const tLow = title.toLowerCase().trim();

                let score = levenshtein(gLow, tLow);
                if (tLow === gLow) score = 0;

                // Penalize sequels
                if (tLow.startsWith(gLow) && tLow.length > gLow.length) {
                    score += 50;
                }

                results.push({ slug, title, score });
                log.info(`Fallback result: "${title}" (${slug}) score=${score}`);
            }
        }

        if (results.length === 0) {
            log.info(`No search results for: ${gameName}`);
            return null;
        }

        // Sort by score (best first)
        results.sort((a, b) => a.score - b.score);
        log.info(`Best match: "${results[0].title}" (${results[0].slug}) score=${results[0].score}`);

        // Safety check for bad matches - only reject if score is very high AND no substring match
        if (results[0].score > 20) {
            const gLow = gameName.toLowerCase();
            if (!results[0].title.toLowerCase().includes(gLow) && !gLow.includes(results[0].title.toLowerCase())) {
                log.info(`Rejecting bad match: score ${results[0].score} too high`);
                return null;
            }
        }

        const bestSlug = results[0].slug;
        const fullUrl = `https://kuli.com.ua/${bestSlug}`;

        // Verify the selected result page
        log.info(`Verifying best match: ${fullUrl}`);
        const gameRes = await fetchWithTimeout(fetchNoCors(fullUrl, { headers }), 8000);
        const gameHtml = await gameRes.text();

        if (isValidGamePage(gameHtml)) {
            log.info(`Verified: ${bestSlug}`);
            return { status: getStatusFromHtml(gameHtml), slug: bestSlug };
        }

        log.info(`Verification failed for ${bestSlug}`);
        return null;
    } catch (e) {
        log.error(`searchKuli failed for ${gameName}:`, e);
        return null;
    }
}
