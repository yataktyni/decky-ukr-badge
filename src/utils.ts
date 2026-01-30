// decky-ukr-badge/utils.ts
import { Router } from "@decky/ui";
import { fetchNoCors } from "@decky/api";
import { callBackend } from "./hooks/useSettings";

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
    console.error("[decky-ukr-badge] Error getting game ID:", e);
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
    console.error("[decky-ukr-badge] Error getting game name:", e);
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

// (Removed unused functions: fetchSteamGameLanguages, hasUkrainianSupport, fetchKuliTranslationStatus, fetchSteamStoreName)

/**
 * Opens a URL in Steam's built-in browser.
 */
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
    console.error("[decky-ukr-badge] Error opening URL:", e);
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
      // This might not work directly, depends on Decky version
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
  try {
    const headers = {
      "Accept": "text/html",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    };

    // 1. Try DIRECT LINK first (propose from user)
    const directSlug = urlifyGameName(gameName);
    const directUrl = `https://kuli.com.ua/${directSlug}`;
    console.log(`[decky-ukr-badge] Trying direct Kuli link: ${directUrl}`);

    try {
      const directRes = await fetchWithTimeout(fetchNoCors(directUrl, { headers }));
      if (directRes.status === 200) {
        const directHtml = await directRes.text();
        // Expand markers to include more reliable ones like html-product-details-page
        const markers = ["html-product-details-page", "game-page", "item__title", "product-essential", "product-name"];
        if (markers.some(m => directHtml.includes(m))) {
          console.log(`[decky-ukr-badge] Direct Kuli link HIT: ${directSlug}`);
          const statusResult = directHtml.includes("item__instruction-main") ? "COMMUNITY" : "OFFICIAL";
          return { status: statusResult, slug: directSlug };
        }
      }
    } catch (e) {
      console.warn(`[decky-ukr-badge] Direct link check failed for ${directSlug}:`, e);
    }

    // 2. Fallback to SEARCH if direct fails
    const searchUrl = `https://kuli.com.ua/games?query=${encodeURIComponent(gameName)}`;
    const res = await fetchWithTimeout(fetchNoCors(searchUrl, { headers }));
    if (res.status !== 200) return null;

    const html = await res.text();

    // Regex Strategies to capture HREF and TITLE
    const results: { href: string; title: string; score: number }[] = [];

    // Helper to process regex matches
    const processMatch = (regex: RegExp) => {
      let match;
      while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const title = match[2].trim();

        // Check if already added
        if (results.some(r => r.href === href)) continue;

        const dist = levenshtein(gameName.toLowerCase(), title.toLowerCase());

        let score = dist;
        // Exact match bonus
        if (title.toLowerCase() === gameName.toLowerCase()) {
          score = 0;
        } else {
          if (!title.toLowerCase().startsWith(gameName.toLowerCase())) score += 5;
          if (Math.abs(title.length - gameName.length) > 5) score += 2;
        }

        results.push({ href, title, score });
      }
    };

    // 1. Standard list items
    processMatch(/class="(?:product-item|product-item-full|item-grid)[^"]*".*?href="([^"]+)".*?class="(?:item__title|product-title)">([^<]+)</gs);

    // 2. Fallback if strict title class failed (try to catch title in nested div)
    processMatch(/class="(?:product-item|product-item-full|item-grid)[^"]*".*?href="([^"]+)".*?<h2 class="product-title">.*?<a[^>]*>([^<]+)</gs);

    // 3. Grid items
    processMatch(/class="item-grid[^"]*".*?href="([^"]+)".*?class="item__title">([^<]+)</gs);

    // Fallback if strict parsing failed
    if (results.length === 0) {
      const fallbackMatch = html.match(/class="(?:product-item|product-item-full|item-grid)[^"]*".*?href="([^"]+)"/s);
      if (fallbackMatch) {
        results.push({ href: fallbackMatch[1], title: "Unknown", score: 999 });
      }
    }

    if (results.length === 0) return null;

    // Pick top result
    results.sort((a, b) => a.score - b.score);
    let href = results[0].href;
    console.log(`[decky-ukr-badge] Search Best Match for "${gameName}": "${results[0].title}" (Score: ${results[0].score}) from ${results.length} candidates`);

    if (href.startsWith("/")) href = href.substring(1);
    href = href.replace(/^https:\/\/kuli\.com\.ua\//, "");

    const slug = href;
    const fullUrl = `https://kuli.com.ua/${slug}`;

    // Verify page content for status
    const gameRes = await fetchWithTimeout(fetchNoCors(fullUrl, { headers }));
    if (gameRes.status !== 200) return null;

    const gameHtml = await gameRes.text();
    if (gameHtml.includes("item__instruction-main")) return { status: "COMMUNITY", slug };

    const markers = ["html-product-details-page", "game-page", "item__title", "product-essential", "product-name"];
    if (markers.some(m => gameHtml.includes(m)))
      return { status: "OFFICIAL", slug };

    return null;
  } catch (e) {
    console.error("[decky-ukr-badge] searchKuli failed:", e);
    return null;
  }
}
