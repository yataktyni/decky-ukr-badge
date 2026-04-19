import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useSettingsMock = vi.fn();

vi.mock("../src/hooks/useSettings", () => ({
  useSettings: () => useSettingsMock(),
}));

vi.mock("../src/translations", () => ({
  t: (k: string) => k,
  getSupportedLanguage: () => "en",
}));

vi.mock("../src/components/Spinner", () => ({
  default: () => React.createElement("div", {}, "spinner"),
}));

vi.mock("../src/components/LinksSection", () => ({
  LinksSection: ({ lang }: { lang: string }) => React.createElement("div", {}, `links-${lang}`),
}));

vi.mock("@decky/ui", () => ({
  PanelSection: ({ children, title }: any) => React.createElement("section", { "data-title": title }, children),
  PanelSectionRow: ({ children }: any) => React.createElement("div", {}, children),
  DropdownItem: ({ label }: any) => React.createElement("div", {}, `dropdown:${label}`),
  SliderField: ({ label }: any) => React.createElement("div", {}, `slider:${label}`),
  ToggleField: ({ label, checked }: any) => React.createElement("div", {}, `toggle:${label}:${checked}`),
  Navigation: { NavigateToExternalWeb: vi.fn() },
}));

import { Settings } from "../src/settings";

describe("Settings component", () => {
  beforeEach(() => {
    useSettingsMock.mockReset();
  });

  it("shows spinner while loading", () => {
    useSettingsMock.mockReturnValue({
      settings: {
        badgeType: "full",
        badgePosition: "top-right",
        offsetX: 20,
        offsetY: 90,
        showOnStore: true,
        storeOffsetX: 0,
        storeOffsetY: 20,
      },
      loading: true,
      setBadgeType: vi.fn(),
      setBadgePosition: vi.fn(),
      setOffsetX: vi.fn(),
      setOffsetY: vi.fn(),
      setShowOnStore: vi.fn(),
      setStoreOffsetX: vi.fn(),
      setStoreOffsetY: vi.fn(),
    });

    render(React.createElement(Settings));
    expect(screen.getByText("spinner")).toBeInTheDocument();
    expect(screen.queryByText("links-en")).not.toBeInTheDocument();
  });

  it("renders controls and links section when not loading", () => {
    useSettingsMock.mockReturnValue({
      settings: {
        badgeType: "full",
        badgePosition: "top-right",
        offsetX: 20,
        offsetY: 90,
        showOnStore: true,
        storeOffsetX: 0,
        storeOffsetY: 20,
      },
      loading: false,
      setBadgeType: vi.fn(),
      setBadgePosition: vi.fn(),
      setOffsetX: vi.fn(),
      setOffsetY: vi.fn(),
      setShowOnStore: vi.fn(),
      setStoreOffsetX: vi.fn(),
      setStoreOffsetY: vi.fn(),
    });

    render(React.createElement(Settings));

    expect(screen.getByText("dropdown:badge_type")).toBeInTheDocument();
    expect(screen.getByText("dropdown:badge_position")).toBeInTheDocument();
    expect(screen.getByText("toggle:show_on_store:true")).toBeInTheDocument();
    expect(screen.getByText("slider:store_x_offset")).toBeInTheDocument();
    expect(screen.getByText("slider:store_y_offset")).toBeInTheDocument();
    expect(screen.getByText("slider:x_offset")).toBeInTheDocument();
    expect(screen.getByText("slider:y_offset")).toBeInTheDocument();
    expect(screen.getByText("links-en")).toBeInTheDocument();
  });

  it("hides store sliders when showOnStore is false", () => {
    useSettingsMock.mockReturnValue({
      settings: {
        badgeType: "full",
        badgePosition: "top-right",
        offsetX: 20,
        offsetY: 90,
        showOnStore: false,
        storeOffsetX: 0,
        storeOffsetY: 20,
      },
      loading: false,
      setBadgeType: vi.fn(),
      setBadgePosition: vi.fn(),
      setOffsetX: vi.fn(),
      setOffsetY: vi.fn(),
      setShowOnStore: vi.fn(),
      setStoreOffsetX: vi.fn(),
      setStoreOffsetY: vi.fn(),
    });

    render(React.createElement(Settings));

    expect(screen.queryByText("slider:store_x_offset")).not.toBeInTheDocument();
    expect(screen.queryByText("slider:store_y_offset")).not.toBeInTheDocument();
    expect(screen.getByText("slider:x_offset")).toBeInTheDocument();
    expect(screen.getByText("slider:y_offset")).toBeInTheDocument();
  });
});
