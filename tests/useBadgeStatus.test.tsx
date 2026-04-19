import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchNoCorsMock = vi.fn();
const cleanNonSteamNameMock = vi.fn((s: string) => s);
const searchKuliMock = vi.fn();
const fetchWithTimeoutMock = vi.fn();
const isSteamAppIdMock = vi.fn();
const callBackendMock = vi.fn();

vi.mock("@decky/api", () => ({
  fetchNoCors: (...args: any[]) => fetchNoCorsMock(...args),
}));

vi.mock("../src/hooks/useSettings", () => ({
  callBackend: (method: string, ...args: unknown[]) => callBackendMock(method, ...args),
}));

vi.mock("../src/utils", () => ({
  cleanNonSteamName: (...args: any[]) => cleanNonSteamNameMock(...args),
  searchKuli: (...args: any[]) => searchKuliMock(...args),
  fetchWithTimeout: (...args: any[]) => fetchWithTimeoutMock(...args),
  isSteamAppId: (...args: any[]) => isSteamAppIdMock(...args),
}));

vi.mock("../src/logger", () => ({
  logger: {
    component: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { useBadgeStatus } from "../src/hooks/useBadgeStatus";

function HookProbe(props: { appId?: string; appName?: string; onState: (s: any) => void }) {
  const state = useBadgeStatus(props.appId, props.appName);
  props.onState(state);
  return React.createElement("div");
}

describe("useBadgeStatus", () => {
  beforeEach(() => {
    fetchNoCorsMock.mockReset();
    cleanNonSteamNameMock.mockReset();
    cleanNonSteamNameMock.mockImplementation((s: string) => s);
    searchKuliMock.mockReset();
    fetchWithTimeoutMock.mockReset();
    isSteamAppIdMock.mockReset();
    callBackendMock.mockReset();
  });

  it("returns OFFICIAL when Steam metadata includes ukrainian", async () => {
    isSteamAppIdMock.mockReturnValue(true);
    fetchNoCorsMock.mockResolvedValue({});
    fetchWithTimeoutMock.mockResolvedValue({
      json: async () => ({
        "123": {
          success: true,
          data: { name: "GameName", supported_languages: "English, Ukrainian" },
        },
      }),
    });
    searchKuliMock.mockResolvedValue(null);

    let latest: any;
    render(React.createElement(HookProbe, { appId: "123", appName: "Game", onState: (s: any) => (latest = s) }));

    await waitFor(() => {
      expect(latest.loading).toBe(false);
      expect(latest.status).toBe("OFFICIAL");
    });
  });

  it("returns COMMUNITY with kuli url when steam is not official", async () => {
    isSteamAppIdMock.mockReturnValue(true);
    fetchNoCorsMock.mockResolvedValue({});
    fetchWithTimeoutMock.mockResolvedValue({
      json: async () => ({
        "456": {
          success: true,
          data: { name: "Another Game", supported_languages: "English" },
        },
      }),
    });
    searchKuliMock.mockResolvedValue({ status: "COMMUNITY", slug: "another-game" });

    let latest: any;
    render(React.createElement(HookProbe, { appId: "456", appName: "Another", onState: (s: any) => (latest = s) }));

    await waitFor(() => {
      expect(latest.loading).toBe(false);
      expect(latest.status).toBe("COMMUNITY");
      expect(latest.url).toBe("https://kuli.com.ua/another-game");
    });
  });

  it("returns NONE on hard error path", async () => {
    isSteamAppIdMock.mockImplementation(() => {
      throw new Error("boom");
    });

    let latest: any;
    render(React.createElement(HookProbe, { appId: "999", appName: "Broken", onState: (s: any) => (latest = s) }));

    await waitFor(() => {
      expect(latest.loading).toBe(false);
      expect(latest.status).toBe("NONE");
    });
  });
});
