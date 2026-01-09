// decky-ukr-badge/utils.ts
import { Router } from "@decky/ui";

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
    const match = pathname.match(/\/routes\/appdetails\/(\d+)/);
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
 * Converts a game name to a URL-friendly format for kuli.com.ua
 */
export function urlifyGameName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Fetches supported languages for a Steam game from the Steam API.
 * Returns an array of language names (lowercase) or null on error.
 */
export async function fetchSteamGameLanguages(
  appId: string,
): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      console.warn(`[decky-ukr-badge] Steam API returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const appData = data[appId];

    if (!appData?.success || !appData?.data) {
      return null;
    }

    const htmlLangs = appData.data.supported_languages || "";

    // Parse the HTML string to extract language names
    // Steam format: "<strong>*</strong>Ukrainian<br>..." or just language names separated by <br>
    // Languages with full audio support are marked with <strong>*</strong>

    // Create a temporary element to parse HTML (safe approach)
    const langText = htmlLangs
      .replace(/<strong>\*<\/strong>/g, "")
      .replace(/<br\s*\/?>/gi, ",")
      .replace(/<[^>]*>/g, "");

    const langs = langText
      .split(",")
      .map((lang: string) => lang.trim().toLowerCase())
      .filter((lang: string) => lang.length > 0);

    return langs.length > 0 ? langs : null;
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

  const urlName = urlifyGameName(gameName);

  try {
    const res = await fetch(`https://kuli.com.ua/${urlName}`, {
      method: "GET",
      headers: {
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      // 404 means the game isn't on kuli.com.ua
      if (res.status === 404) {
        return null;
      }
      console.warn(`[decky-ukr-badge] Kuli returned ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Check if the page exists and has translation info
    // The presence of .item__instruction-main indicates a community translation with instructions
    const hasInstruction = html.includes("item__instruction-main");

    if (hasInstruction) {
      // Community translation (has installation instructions)
      return "COMMUNITY";
    }

    // If the page exists but has no instruction, it's officially supported
    // Check if it's actually a game page (not a 404 page or error)
    const isGamePage =
      html.includes("game-page") || html.includes("item__title");

    if (isGamePage) {
      return "OFFICIAL";
    }

    return null;
  } catch (e) {
    console.error("[decky-ukr-badge] Error fetching Kuli status:", e);
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
