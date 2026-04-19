import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

describe("LinksSection update flow", () => {
  const openUrl = vi.fn();

  beforeEach(() => {
    callMock.mockReset();
    openUrl.mockReset();
  });

  it("shows stable update button label and separate update meta line", async () => {
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
      expect(screen.getByText(/^update_plugin$/i)).toBeInTheDocument();
      expect(screen.getByText(/update_to v1.1.0/i)).toBeInTheDocument();
    });
  });

  it("handles successful update and renders success status", async () => {
    callMock
      .mockResolvedValueOnce("1.0.0")
      .mockResolvedValueOnce({
        current: "1.0.0",
        latest: "1.1.0",
        latest_tag: "v1.1.0",
        update_available: true,
      })
      .mockResolvedValueOnce({ success: true, already_current: false })
      .mockResolvedValueOnce({
        current: "1.1.0",
        latest: "1.1.0",
        latest_tag: "v1.1.0",
        update_available: false,
      });

    render(React.createElement(LinksSection, { lang: "en", openUrl }));

    await waitFor(() => screen.getByText(/^update_plugin$/i));

    fireEvent.click(screen.getByText(/^update_plugin$/i));

    await waitFor(() => {
      expect(screen.getByText(/update_success - restart_to_apply/i)).toBeInTheDocument();
    });
  });

  it("handles already-current update response", async () => {
    callMock
      .mockResolvedValueOnce("1.0.0")
      .mockResolvedValueOnce({
        current: "1.0.0",
        latest: "1.0.0",
        latest_tag: "v1.0.0",
        update_available: false,
      })
      .mockResolvedValueOnce({ success: true, already_current: true });

    render(React.createElement(LinksSection, { lang: "en", openUrl }));

    await waitFor(() => screen.getByText(/^update_plugin$/i));

    fireEvent.click(screen.getByText(/^update_plugin$/i));

    await waitFor(() => {
      expect(screen.getByText(/already_up_to_date/i)).toBeInTheDocument();
    });
  });

  it("renders error message when update fails", async () => {
    callMock
      .mockResolvedValueOnce("1.0.0")
      .mockResolvedValueOnce({
        current: "1.0.0",
        latest: "1.2.0",
        latest_tag: "v1.2.0",
        update_available: true,
      })
      .mockResolvedValueOnce({ success: false, error: "Download failed" });

    render(React.createElement(LinksSection, { lang: "en", openUrl }));

    await waitFor(() => screen.getByText(/^update_plugin$/i));

    fireEvent.click(screen.getByText(/^update_plugin$/i));

    await waitFor(() => {
      expect(screen.getByText(/update_error: Download failed/i)).toBeInTheDocument();
    });
  });
});
