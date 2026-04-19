import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const callMock = vi.fn();

vi.mock("@decky/api", () => ({
  call: (...args: any[]) => callMock(...args),
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

import { loadSettings, useSettings, callBackend } from "../src/hooks/useSettings";

function HookProbe(props: { onSnapshot: (v: any) => void }) {
  const state = useSettings();
  props.onSnapshot(state);
  return React.createElement("div");
}

describe("useSettings / loadSettings", () => {
  beforeEach(() => {
    callMock.mockReset();
  });

  it("callBackend proxies call result", async () => {
    callMock.mockResolvedValueOnce({ ok: true });
    const res = await callBackend<any>("x_method", 1, "a");
    expect(res).toEqual({ ok: true });
    expect(callMock).toHaveBeenCalledWith("x_method", 1, "a");
  });

  it("loadSettings populates values from backend", async () => {
    callMock.mockResolvedValueOnce({
      badgeType: "default",
      badgePosition: "top-left",
      offsetX: 12,
      offsetY: 34,
      showOnStore: false,
      storeOffsetX: 7,
      storeOffsetY: 9,
    });

    loadSettings();

    const snapshots: any[] = [];
    render(React.createElement(HookProbe, { onSnapshot: (v: any) => snapshots.push(v) }));

    await waitFor(() => {
      const last = snapshots[snapshots.length - 1];
      expect(last.loading).toBe(false);
      expect(last.settings.badgeType).toBe("default");
      expect(last.settings.badgePosition).toBe("top-left");
      expect(last.settings.offsetX).toBe(12);
    });
  });

  it("setter updates local state and persists via set_settings", async () => {
    callMock.mockResolvedValueOnce({
      badgeType: "full",
      badgePosition: "top-right",
      offsetX: 20,
      offsetY: 90,
      showOnStore: true,
      storeOffsetX: 0,
      storeOffsetY: 20,
    });

    loadSettings();

    let latest: any;
    render(React.createElement(HookProbe, { onSnapshot: (v: any) => (latest = v) }));

    await waitFor(() => expect(latest?.loading).toBe(false));

    callMock.mockResolvedValueOnce(true);
    await act(async () => {
      await latest.setOffsetX(123);
    });

    await waitFor(() => {
      expect(latest.settings.offsetX).toBe(123);
    });
    expect(callMock).toHaveBeenLastCalledWith("set_settings", "offsetX", 123);
  });
});
