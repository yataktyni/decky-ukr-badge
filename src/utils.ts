// decky-ukr-badge/src/utils.ts
import { call } from "@decky/api";
import { fetchNoCors } from "@decky/api";
import { logger } from "./logger";
import { callBackend } from "./hooks/useSettings";

const log = logger.component("utils");

/**
 * Cleans a game name by removing common non-Steam tags and versions.
 */
export function cleanNonSteamName(name: string): string {
    if (!name) return "";
    return name
        .replace(/\s*\((Shortcut|Non-Steam|App|Game)\)$/i, "")
        .replace(/\s*(?:v|version|ver)\.?\s*\d+(?:\.\d+)*/i, "")
        .replace(/\s*(?:Remastered|Definitive Edition|Director's Cut|Enhanced Edition|Game of the Year|GOTY|Special Edition|Legendary Edition|Complete Edition|Deluxe Edition|Ultimate Edition)$/i, "")
        .trim();
}

/**
 * Checks if an AppID is a standard Steam Game ID (as opposed to a non-Steam shortcut).
 */
export function isSteamAppId(appId: string | undefined): boolean {
    if (!appId) return false;
    const id = parseInt(appId, 10);
    // Standard Steam AppIDs are currently < 1,000,000,000.
    // Non-Steam shortcuts typically have much larger IDs or IDs derived from their path/name.
    return !isNaN(id) && id < 1000000000;
}

/**
 * Converts a game name to a URL-friendly format for kuli.com.ua
 */
export function urlifyGameName(name: string): string {
    const cleaned = cleanNonSteamName(name);
    return cleaned
        .toLowerCase()
        .replace(/[':’]/g, "")
        .replace(/&/g, "and")
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

    // Internal helper to perform search with a given query
    async function performSearch(query: string): Promise<{ status: string, slug: string } | null> {
        try {
            const headers = {
                "Accept": "text/html",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            };

            // Helper: detect if response is a valid game page (not 404/redirect)
            const isValidGamePage = (html: string): boolean => {
                const hLow = html.toLowerCase();
                if (hLow.includes('page-not-found') ||
                    hLow.includes('сторінку не знайдено') ||
                    hLow.includes('404')) {
                    return false;
                }
                return hLow.includes('product-details-page') ||
                    hLow.includes('product-essential') ||
                    hLow.includes('item__instruction-main');
            };

            const getStatusFromHtml = (html: string): string => {
                if (html.toLowerCase().includes("item__instruction-main")) return "COMMUNITY";
                return "OFFICIAL";
            };

            // 1. Try DIRECT LINK first
            const directSlug = urlifyGameName(query);
            const directUrl = `https://kuli.com.ua/${directSlug}`;
            log.info(`Trying direct Kuli link for "${query}": ${directUrl}`);

            try {
                const directRes = await fetchWithTimeout(fetchNoCors(directUrl, { headers }), 8000);
                const directHtml = await directRes.text();

                if (isValidGamePage(directHtml)) {
                    log.info(`Direct link HIT for "${query}" -> ${directSlug}`);
                    return { status: getStatusFromHtml(directHtml), slug: directSlug };
                }
            } catch (e) {
                log.warn(`Direct check failed for ${directSlug}:`, e);
            }

            // 2. Fallback to SEARCH
            log.info(`Searching Kuli for: ${query}`);
            const searchUrl = `https://kuli.com.ua/games?query=${encodeURIComponent(query)}`;
            const res = await fetchWithTimeout(fetchNoCors(searchUrl, { headers }), 10000);

            const html = await res.text();
            const results: { slug: string; title: string; score: number }[] = [];

            // More robust product item matching
            const productItemRegex = /href="\/([a-z0-9-]+)"[^>]*>[\s\S]*?class="product-title[^"]*"[^>]*>[\s\S]*?([^<]+)</gi;

            let match;
            while ((match = productItemRegex.exec(html)) !== null) {
                const slug = match[1];
                const title = match[2].trim();

                if (!title || !slug || slug === 'games' || results.some(r => r.slug === slug)) continue;

                const qLow = query.toLowerCase().trim();
                const tLow = title.toLowerCase().trim();

                let score = levenshtein(qLow, tLow);
                if (tLow === qLow) score = 0;
                else if (tLow.includes(qLow) || qLow.includes(tLow)) score = Math.min(score, 10);

                results.push({ slug, title, score });
            }

            if (results.length === 0) return null;

            results.sort((a, b) => a.score - b.score);
            const best = results[0];

            if (best.score > 25) {
                log.info(`Rejecting match "${best.title}" (score ${best.score}) for query "${query}"`);
                return null;
            }

            log.info(`Best match for "${query}": "${best.title}" (${best.slug}) score=${best.score}`);

            // Verify verification page
            const verifyUrl = `https://kuli.com.ua/${best.slug}`;
            const verifyRes = await fetchWithTimeout(fetchNoCors(verifyUrl, { headers }), 8000);
            const verifyHtml = await verifyRes.text();

            if (isValidGamePage(verifyHtml)) {
                return { status: getStatusFromHtml(verifyHtml), slug: best.slug };
            }

            return null;
        } catch (e) {
            log.error(`performSearch failed for ${query}:`, e);
            return null;
        }
    }

    // Attempt 1: Full cleaned name
    let result = await performSearch(gameName);
    if (result) return result;

    // Attempt 2: If name is long/complex, try first two words
    const words = cleanNonSteamName(gameName).split(/\s+/);
    if (words.length > 2) {
        const shorterQuery = words.slice(0, 2).join(" ");
        log.info(`Retrying with shorter query: "${shorterQuery}"`);
        result = await performSearch(shorterQuery);
        if (result) return result;
    }

    return null;
}
