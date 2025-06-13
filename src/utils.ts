// decky-ukr-badge/utils.ts
import * as cheerio from "cheerio";

export function getGameId(): string {
    // Replace with real Decky API method for getting appId
    return window.location.pathname.split("/").pop() || "";
}

export function getGameNameUrlified(): string {
    const title = document.querySelector(".apphub_AppName")?.textContent || "";
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
}

export async function fetchSteamGameLanguages(appId: string): Promise<string[] | null> {
    try {
        const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`);
        const data = await res.json();
        const htmlLangs = data[appId]?.data?.supported_languages || "";
        const $ = cheerio.load(htmlLangs);
        // Steam wraps language names in <b> tags usually
        const langs = $("b").map((_, el) => $(el).text().toLowerCase().trim()).get();
        return langs.length ? langs : null;
    } catch {
        return null;
    }
}

export async function fetchKuliTranslationStatus(urlName: string): Promise<"OFFICIAL" | "COMMUNITY" | null> {
    try {
        const res = await fetch(`https://kuli.com.ua/${urlName}#translations`, { method: "GET" });
        const html = await res.text();
        const $ = cheerio.load(html);
        const hasInstruction = $(".item__instruction-main").length > 0;

        if (!hasInstruction) {
            return "OFFICIAL";
        } else {
            return "COMMUNITY";
        }

        return null;
    } catch (e) {
        console.error("Error fetching Kuli translation status:", e);
        return null;
    }
}

export function openInSteamBrowser(url: string) {
    window.open(url, "_blank");
}

export function getSteamLanguage(): string {
    return navigator.language.toLowerCase();
}
