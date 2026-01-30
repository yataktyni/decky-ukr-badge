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

/**
 * Fetches supported languages for a Steam game from the Steam API.
 * Returns an array of language names (lowercase) or null on error.
 */
export async function fetchSteamGameLanguages(
  appId: string,
): Promise<string[] | null> {
  try {
    return await callBackend<string[]>("get_steam_languages", appId);
  } catch (e) {
    console.error("[decky-ukr-badge] Error fetching Steam languages:", e);
    return null;
  }
}

/**
 * Checks if Ukrainian is in the list of supported languages.
 */
export function hasUkrainianSupport(languages: string[]): boolean {
  return languages.some(
    (lang) => lang === "ukrainian" || lang.includes("ukrainian"),
  );
}

/**
 * Fetches translation status from kuli.com.ua.
 * Returns "OFFICIAL" if native support, "COMMUNITY" if fan translation exists, null otherwise.
 */
export async function fetchKuliTranslationStatus(
  gameName: string,
): Promise<"OFFICIAL" | "COMMUNITY" | null> {
  if (!gameName) {
    return null;
  }

  try {
    const response = await callBackend<{ status: string; url: string }>("get_kuli_status", gameName);
    const status = response?.status;
    if (status === "OFFICIAL" || status === "COMMUNITY") {
      return status as "OFFICIAL" | "COMMUNITY";
    }
    return null;
  } catch (e) {
    console.error(`[decky-ukr-badge] Error fetching Kuli status for ${gameName}:`, e);
    return null;
  }
}

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

export async function searchKuli(gameName: string): Promise<{ status: string, slug: string } | null> {
  try {
    const searchUrl = `https://kuli.com.ua/games?query=${encodeURIComponent(gameName)}`;
    const headers = {
      "Accept": "text/html",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    };

    const res = await fetchWithTimeout(fetchNoCors(searchUrl, { headers }));
    if (res.status !== 200) return null;

    const html = await res.text();

    // Regex strategies
    let match = html.match(/class="product-item[^"]*".*?href="([^"]+)"/s);
    if (!match) match = html.match(/class="product-item-full[^"]*".*?href="([^"]+)"/s);
    if (!match) match = html.match(/class="item-grid".*?href="([^"]+)"/s);

    if (!match) return null;

    let href = match[1];
    if (href.startsWith("/")) href = href.substring(1);
    // Remove domain if present
    href = href.replace(/^https:\/\/kuli\.com\.ua\//, "");

    const slug = href;
    const fullUrl = `https://kuli.com.ua/${slug}`;

    // Verify page content for status
    const gameRes = await fetchWithTimeout(fetchNoCors(fullUrl, { headers }));
    if (gameRes.status !== 200) return null;

    const gameHtml = await gameRes.text();
    if (gameHtml.includes("item__instruction-main")) return { status: "COMMUNITY", slug };
    if (gameHtml.includes("html-product-details-page") || gameHtml.includes("game-page") || gameHtml.includes("item__title"))
      return { status: "OFFICIAL", slug };

    return null;
  } catch (e) {
    console.error("[decky-ukr-badge] searchKuli failed:", e);
    return null;
  }
}
