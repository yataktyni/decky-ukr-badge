// decky-ukr-badge/src/index.tsx
import { definePlugin, routerHook } from "@decky/api";
import {
    afterPatch,
    findInReactTree,
    appDetailsClasses,
    createReactTreePatcher,
    staticClasses,
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
    const libraryPatch = routerHook.addPatch("/library/app/:appid", (tree: any) => {
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

                    if (typeof container !== "object") return ret;

                    const topCapsule = findInReactTree(ret, (x: any) => x?.props?.className?.includes(appDetailsHeaderClasses.TopCapsule));
                    if (topCapsule && !findInReactTree(topCapsule, (x: any) => x?.key === "ukr-flag-header")) {
                        topCapsule.props.children.unshift(
                            <span key="ukr-flag-header" style={{ marginRight: "10px", fontSize: "1.2em", verticalAlign: "middle" }}>🇺🇦</span>
                        );
                    }

                    const protonDBExists = hasProtonDBBadge();
                    if (!findInReactTree(container, (x: any) => x?.key === "ukr-badge")) {
                        container.props.children.splice(
                            1,
                            0,
                            <Badge key="ukr-badge" protonDBExists={protonDBExists} />,
                        );
                    }

                    return ret;
                },
            );

            afterPatch(routeProps, "renderFunc", patchHandler);
        }

        return tree;
    });
    return libraryPatch;
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
