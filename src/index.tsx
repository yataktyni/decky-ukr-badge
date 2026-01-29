// decky-ukr-badge/src/index.tsx
import React, { useState } from "react";
import { definePlugin, routerHook } from "@decky/api";
import {
    afterPatch,
    findInReactTree,
    appDetailsClasses,
    appDetailsHeaderClasses,
    createReactTreePatcher,
    PanelSection,
    PanelSectionRow,
    ToggleField,
    staticClasses,
    Navigation,
} from "@decky/ui";
import { FaFlag } from "react-icons/fa";

import { Settings } from "./settings";

import Badge from "./components/Badge";
import StoreOverlay from "./components/StoreOverlay";
import { loadSettings } from "./hooks/useSettings";
import { initStorePatch } from "./patches/StorePatch";

/**
 * Check if ProtonDB badge plugin is present to avoid overlap
 */
function hasProtonDBBadge(): boolean {
    try {
        if (typeof window !== "undefined") {
            const protonBadgeExists = document.querySelector('[class*="protonbadge"], [class*="proton-badge"], [id*="protondb"]');
            if (protonBadgeExists) return true;

            if ((window as any).protonbadge || (window as any).ProtonDBBadge) {
                return true;
            }
        }
    } catch (e) { }
    return false;
}

/**
 * Patches the library app page to inject the Ukrainian badge.
 * Based on ProtonDB Badges implementation, with compatibility for ProtonDB badge.
 */
function patchLibraryApp() {
    return routerHook.addPatch("/library/app/:appid", (tree: any) => {
        const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);

        if (routeProps) {
            const patchHandler = createReactTreePatcher(
                [
                    (tree: any) =>
                        findInReactTree(
                            tree,
                            (x: any) => x?.props?.children?.props?.overview,
                        )?.props?.children,
                ],
                (
                    _: Array<Record<string, unknown>>,
                    ret?: React.ReactElement,
                ) => {
                    const container = findInReactTree(
                        ret,
                        (x: React.ReactElement) =>
                            Array.isArray(x?.props?.children) &&
                            x?.props?.className?.includes(
                                appDetailsClasses.InnerContainer,
                            ),
                    );

                    if (typeof container !== "object") {
                        return ret;
                    }

                    // Check if ProtonDB badge exists and adjust position
                    const protonDBExists = hasProtonDBBadge();

                    // Inject the badge at position 1 (after the header)
                    container.props.children.splice(
                        1,
                        0,
                        <Badge key="ukr-badge" protonDBExists={protonDBExists} />,
                    );

                    return ret;
                },
            );

            // Patch 2: Add flag icon to TopCapsule header (matches user request for header badge)
            const patchHandlerHeader = createReactTreePatcher(
                [
                    (tree: any) =>
                        findInReactTree(
                            tree,
                            (x: any) => x?.props?.children?.props?.overview,
                        )?.props?.children,
                ],
                (
                    _: Array<Record<string, unknown>>,
                    ret?: React.ReactElement,
                ) => {
                    const headerContainer = findInReactTree(
                        ret,
                        (x: React.ReactElement) =>
                            x?.props?.className?.includes(appDetailsClasses.Header),
                    );

                    if (typeof headerContainer !== "object") return ret;

                    const topCapsule = findInReactTree(
                        headerContainer,
                        (x: React.ReactElement) =>
                            x?.props?.className?.includes(appDetailsHeaderClasses.TopCapsule),
                    );

                    if (typeof topCapsule === "object" && topCapsule?.props) {
                        const protonDBExists = hasProtonDBBadge();
                        const headerIcon = (
                            <div
                                key="ukr-badge-header-icon"
                                style={{
                                    marginRight: protonDBExists ? "10px" : "20px",
                                    marginLeft: "10px",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    zIndex: 100
                                }}
                                title="Ukrainian Language Support"
                                onClick={() => Navigation.NavigateToExternalWeb("https://store.steampowered.com/search/?supportedlang=ukrainian")}
                            >
                                🇺🇦
                            </div>
                        );

                        // Ensure children is an array and add icon if not already present
                        const children = topCapsule.props.children;
                        if (Array.isArray(children)) {
                            if (!children.some((c: any) => c?.key === "ukr-badge-header-icon")) {
                                children.unshift(headerIcon);
                            }
                        } else {
                            topCapsule.props.children = [headerIcon, children].filter(Boolean);
                        }
                    }

                    return ret;
                },
            );

            afterPatch(routeProps, "renderFunc", patchHandler);
            afterPatch(routeProps, "renderFunc", patchHandlerHeader);
        }

        return tree;
    });
}



/**
 * Settings Panel Component for the Quick Access Menu
 */
const SettingsPanel: React.FC = () => {
    return (
        <>
            <Settings />
        </>
    );
};

export default definePlugin(() => {
    // Load settings on plugin init
    loadSettings();

    // Patch the library app page
    const libraryPatch = patchLibraryApp();

    // Initialize store patch (WebSocket injection)
    const stopStorePatch = initStorePatch();

    // Register store overlay placeholder (required for global component but does nothing visually)
    routerHook.addGlobalComponent("UKRStoreOverlay", StoreOverlay);

    return {
        name: "decky-ukr-badge",
        title: <div className={staticClasses.Title}>UA Badge</div>,
        icon: <FaFlag />,
        content: <SettingsPanel />,
        onDismount() {
            routerHook.removePatch("/library/app/:appid", libraryPatch);
            routerHook.removeGlobalComponent("UKRStoreOverlay");
            stopStorePatch();
        },
    };
});
