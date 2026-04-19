import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@decky/api", () => ({
  call: vi.fn(),
}));

import {
  cleanNonSteamName,
  isSteamAppId,
  urlifyGameName,
  openInSteamBrowser,
  fetchWithTimeout,
} from "../src/utils";

declare global {
  // eslint-disable-next-line no-var
  var SteamClient: any;
}

describe("utils", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // @ts-ignore
    global.SteamClient = undefined;
  });

  it("cleanNonSteamName removes non-steam suffixes and versions", () => {
    expect(cleanNonSteamName("Game Name (Non-Steam)")).toBe("Game Name");
    expect(cleanNonSteamName("Game v1.2.3")).toBe("Game");
  });

  it("isSteamAppId distinguishes steam ids", () => {
    expect(isSteamAppId("730")).toBe(true);
    expect(isSteamAppId("12345678901")).toBe(false);
    expect(isSteamAppId(undefined)).toBe(false);
  });

  it("urlifyGameName slugifies correctly", () => {
    expect(urlifyGameName("Tom Clancy's Game: Remastered")).toBe("tom-clancys-game");
  });

  it("openInSteamBrowser uses SteamClient when available", () => {
    const openSpy = vi.fn();
    // @ts-ignore
    global.SteamClient = { System: { OpenInSystemBrowser: openSpy } };
    openInSteamBrowser("https://example.com");
    expect(openSpy).toHaveBeenCalledWith("https://example.com");
  });

  it("openInSteamBrowser falls back to window.open", () => {
    const wOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    openInSteamBrowser("https://example.com");
    expect(wOpen).toHaveBeenCalledWith("https://example.com", "_blank");
  });

  it("fetchWithTimeout resolves normal promise", async () => {
    const resp = new Response("ok");
    const out = await fetchWithTimeout(Promise.resolve(resp), 1000);
    expect(out).toBe(resp);
  });
});
