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
} from "@decky/ui";
import { FaFlag } from "react-icons/fa";

import { Settings } from "./settings";

import Badge from "./components/Badge";
import StoreOverlay from "./components/StoreOverlay";
import { loadSettings } from "./hooks/useSettings";

/**
 * Check if ProtonDB badge plugin is present to avoid overlap
 */
function hasProtonDBBadge(): boolean {
    try {
        // Check for ProtonDB badge indicators in the DOM or window
        if (typeof window !== "undefined") {
            // Check if protonbadge elements exist
            const protonBadgeExists = document.querySelector('[class*="protonbadge"], [class*="proton-badge"], [id*="protonbadge"]');
            if (protonBadgeExists) return true;

            // Check window for ProtonDB plugin indicators
            if ((window as any).protonbadge || (window as any).ProtonDBBadge) {
                return true;
            }
        }
    } catch (e) {
        // Ignore errors in detection
    }
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
            // Patch 1: Inject badge into InnerContainer (existing behavior)
            const patchHandlerInner = createReactTreePatcher(
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

            // Patch 2: Add icon to TopCapsule header (like ProtonDB does)
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
                    // Find the Header container
                    const headerContainer = findInReactTree(
                        ret,
                        (x: React.ReactElement) =>
                            x?.props?.className?.includes(
                                appDetailsClasses.Header,
                            ),
                    );

                    if (typeof headerContainer !== "object") {
                        return ret;
                    }

                    // Find TopCapsule within Header
                    const topCapsule = findInReactTree(
                        headerContainer,
                        (x: React.ReactElement) =>
                            x?.props?.className?.includes(
                                appDetailsHeaderClasses.TopCapsule,
                            ),
                    );

                    if (typeof topCapsule === "object" && Array.isArray(topCapsule.props?.children)) {
                        // Check if ProtonDB exists - if so, place icon on the left side instead
                        const protonDBExists = hasProtonDBBadge();

                        // Create a small icon component for the header (like ProtonDB does)
                        const headerIcon = (
                            <div
                                key="ukr-badge-header-icon"
                                style={{
                                    position: "absolute",
                                    [protonDBExists ? "left" : "right"]: "20px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 1000,
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    opacity: 0.8,
                                    pointerEvents: "auto",
                                }}
                                title="Ukrainian Language Support"
                            >
                                🇺🇦
                            </div>
                        );

                        // Inject icon at the beginning of TopCapsule children
                        topCapsule.props.children.unshift(headerIcon);
                    }

                    return ret;
                },
            );

            afterPatch(routeProps, "renderFunc", patchHandlerInner);
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

    // Register store overlay
    routerHook.addGlobalComponent("UKRStoreOverlay", StoreOverlay);

    return {
        name: "decky-ukr-badge",
        title: <div className={staticClasses.Title}>UA Badge</div>,
        icon: <FaFlag />,
        content: <SettingsPanel />,
        onDismount() {
            routerHook.removePatch("/library/app/:appid", libraryPatch);
            routerHook.removeGlobalComponent("UKRStoreOverlay");
        },
    };
});
