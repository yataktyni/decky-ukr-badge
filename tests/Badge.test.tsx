import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@decky/api", () => ({ call: vi.fn() }));
vi.mock("@decky/ui", () => ({
  Focusable: (props: any) => {
    const { onActivate, children, ...rest } = props;
    return React.createElement("button", { ...rest, onClick: onActivate ?? rest.onClick }, children);
  },
}));

const openSpy = vi.fn();

vi.mock("../src/utils", async () => {
  const actual = await vi.importActual<any>("../src/utils");
  return { ...actual, openInSteamBrowser: (...args: any[]) => openSpy(...args) };
});

vi.mock("../src/translations", () => ({
  t: (k: string) => k,
  getSupportedLanguage: () => "en",
}));

vi.mock("../src/hooks/useAppId", () => ({
  useAppId: () => ({ appId: "730", appName: "Counter-Strike 2", isLoading: false }),
}));

let settingsMock: any = {
  badgeType: "full",
  badgePosition: "top-right",
  offsetX: 20,
  offsetY: 90,
  showOnStore: true,
  storeOffsetX: 0,
  storeOffsetY: 20,
};

vi.mock("../src/hooks/useSettings", () => ({
  useSettings: () => ({ settings: settingsMock, loading: false }),
}));

let statusMock: any = { status: "OFFICIAL", url: "https://kuli.example", loading: false };
vi.mock("../src/hooks/useBadgeStatus", () => ({
  useBadgeStatus: () => statusMock,
}));

import Badge from "../src/components/Badge";

describe("Badge component", () => {
  beforeEach(() => {
    openSpy.mockReset();
    settingsMock = {
      badgeType: "full",
      badgePosition: "top-right",
      offsetX: 20,
      offsetY: 90,
      showOnStore: true,
      storeOffsetX: 0,
      storeOffsetY: 20,
    };
    statusMock = { status: "OFFICIAL", url: "https://kuli.example", loading: false };
  });

  it("renders localized status label when badgeType=full", () => {
    render(React.createElement(Badge, { pAppId: "730", pAppName: "CS2" }));
    expect(screen.getByText("official")).toBeInTheDocument();
  });

  it("triggers external open on click when url exists", () => {
    render(React.createElement(Badge, { pAppId: "730", pAppName: "CS2" }));
    fireEvent.click(screen.getByRole("button"));
    expect(openSpy).toHaveBeenCalledWith("https://kuli.example");
  });

  it("does not trigger open when no url", () => {
    statusMock = { status: "NONE", url: "", loading: false };
    render(React.createElement(Badge, { pAppId: "730", pAppName: "CS2" }));
    fireEvent.click(screen.getByRole("button"));
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("applies top-left positioning when configured", () => {
    settingsMock.badgePosition = "top-left";
    settingsMock.offsetX = 33;
    settingsMock.offsetY = 44;

    const { container } = render(React.createElement(Badge, { pAppId: "730", pAppName: "CS2" }));
    const positioned = container.firstElementChild as HTMLElement;
    expect(positioned.style.left).toContain("33px");
    expect(positioned.style.top).toContain("44px");
  });
});
