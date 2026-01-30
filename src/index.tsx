// decky-ukr-badge/src/index.tsx
import { definePlugin, routerHook } from "@decky/api";
import {
    afterPatch,
    findInReactTree,
    appDetailsClasses,
    appDetailsHeaderClasses,
    createReactTreePatcher,
    staticClasses,
} from "@decky/ui";
import { FaFlag } from "react-icons/fa";

import { Settings } from "./settings";

import Badge from "./components/Badge";
import StoreOverlay from "./components/StoreOverlay";
import { loadSettings } from "./hooks/useSettings";
import { initStorePatch } from "./patches/StorePatch";

// Declare appStore for non-Steam game detection
declare const appStore: {
    GetAppOverviewByGameID: (id: number) => {
        appid: number;
        display_name: string;
        app_type: number;
    } | null;
};

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
 * Restored implementation from commit 01983b2293ba09c3a7a9cfc10a477e5507b61a7a
 */
function patchLibraryApp() {
    return routerHook.addPatch("/library/app/:appid", (tree: any) => {
        const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);

        if (routeProps) {
            // Patch 1: Add Badge component to InnerContainer
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
                    const overview = findInReactTree(ret, (x: any) => x?.props?.overview)?.props?.overview;
                    let appId = overview?.appid ? String(overview.appid) : undefined;
                    let appName = overview?.display_name || "";

                    // Fallback AppID and Name extraction from route/appStore if overview fails
                    if (!appId || !appName) {
                        const match = window.location.pathname.match(/\/appdetails\/(\d+)/);
                        const pathId = match ? match[1] : undefined;

                        if (pathId) {
                            if (!appId) appId = pathId;
                            try {
                                const details = appStore.GetAppOverviewByGameID(parseInt(pathId, 10));
                                if (details && !appName) appName = details.display_name;
                            } catch (e) { }
                        }
                    }

                    const container = findInReactTree(
                        ret,
                        (x: React.ReactElement) =>
                            Array.isArray(x?.props?.children) &&
                            x?.props?.className?.includes(
                                appDetailsClasses.InnerContainer,
                            ),
                    );

                    if (typeof container !== "object" || !container) {
                        return ret;
                    }

                    if (!findInReactTree(container, (x: any) => x?.key === "ukr-badge")) {
                        container.props.children.splice(
                            1,
                            0,
                            <Badge
                                key="ukr-badge"
                                pAppId={appId}
                                pAppName={appName}
                            />,
                        );
                    }

                    return ret;
                },
            );

            // Patch 2: Add icon to TopCapsule header
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
                    const topCapsule = findInReactTree(
                        ret,
                        (x: React.ReactElement) =>
                            Array.isArray(x?.props?.children) &&
                            x?.props?.className?.includes(
                                appDetailsHeaderClasses.TopCapsule,
                            ),
                    );

                    if (typeof topCapsule !== "object" || !topCapsule) {
                        return ret;
                    }

                    if (!findInReactTree(topCapsule, (x: any) => x?.key === "ukr-badge-header")) {
                        const protonDBExists = hasProtonDBBadge();

                        const headerIcon = (
                            <div
                                key="ukr-badge-header"
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

    // Initialize store patch (WebSocket injection)
    const stopStorePatch = initStorePatch();

    // Register store overlay placeholder
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
