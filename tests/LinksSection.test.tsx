import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const callMock = vi.fn();

vi.mock("@decky/api", () => ({
  call: (...args: any[]) => callMock(...args),
}));

vi.mock("@decky/ui", () => ({
  PanelSection: ({ children }: any) => React.createElement("div", {}, children),
  PanelSectionRow: ({ children }: any) => React.createElement("div", {}, children),
  ButtonItem: ({ children, onClick, disabled }: any) =>
    React.createElement("button", { onClick, disabled }, children),
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

vi.mock("../src/translations", () => ({
  t: (k: string) => k,
}));

import { LinksSection } from "../src/components/LinksSection";

describe("LinksSection version-only view", () => {
  const openUrl = vi.fn();

  beforeEach(() => {
    callMock.mockReset();
    openUrl.mockReset();
  });

  it("shows only current version and hides update/diagnostics actions", async () => {
    callMock
      .mockResolvedValueOnce("1.0.0")
      .mockResolvedValueOnce({
        current: "1.0.0",
        latest: "1.1.0",
        latest_tag: "v1.1.0",
        update_available: true,
      });

    render(React.createElement(LinksSection, { lang: "en", openUrl }));

    await waitFor(() => {
      expect(screen.getByText(/Version: v1.0.0/i)).toBeTruthy();
    });

    expect(screen.queryByText(/^update_plugin$/i)).toBeNull();
    expect(screen.queryByText(/Run Version Diagnostics/i)).toBeNull();
    expect(screen.queryByText(/Force Update/i)).toBeNull();
  });

  it("still renders version when get_latest_version fails", async () => {
    callMock
      .mockResolvedValueOnce("1.0.0")
      .mockRejectedValueOnce(new Error("GitHub failed"));

    render(React.createElement(LinksSection, { lang: "en", openUrl }));

    await waitFor(() => {
      expect(screen.getByText(/Version: v1.0.0/i)).toBeTruthy();
    });
  });
});
