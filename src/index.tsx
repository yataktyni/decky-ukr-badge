// decky-ukr-badge/src/index.tsx
import React, { useState } from "react";
import { definePlugin, routerHook } from "@decky/api";
import {
    afterPatch,
    findInReactTree,
    appDetailsClasses,
    createReactTreePatcher,
    PanelSection,
    PanelSectionRow,
    ToggleField,
    staticClasses,
} from "@decky/ui";
import { FaFlag } from "react-icons/fa";

import { Settings } from "./settings";
import { DebugPanel } from "./debugPanel";
import Badge from "./components/Badge";
import { loadSettings } from "./hooks/useSettings";

/**
 * Patches the library app page to inject the Ukrainian badge.
 * Based on ProtonDB Badges implementation.
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

                    // Inject the badge at position 1 (after the header)
                    container.props.children.splice(
                        1,
                        0,
                        <Badge key="ukr-badge" />,
                    );

                    return ret;
                },
            );

            afterPatch(routeProps, "renderFunc", patchHandler);
        }

        return tree;
    });
}

/**
 * Settings Panel Component for the Quick Access Menu
 */
const SettingsPanel: React.FC = () => {
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    return (
        <>
            <Settings />
            <PanelSection title="🛠️ Developer">
                <PanelSectionRow>
                    <ToggleField
                        label="Show Developer Tools"
                        description="Debug info, logs, and system controls"
                        checked={showDebugPanel}
                        onChange={setShowDebugPanel}
                    />
                </PanelSectionRow>
            </PanelSection>
            {showDebugPanel && <DebugPanel />}
        </>
    );
};

export default definePlugin(() => {
    // Load settings on plugin init
    loadSettings();

    // Patch the library app page
    const libraryPatch = patchLibraryApp();

    return {
        name: "decky-ukr-badge",
        title: <div className={staticClasses.Title}>UA Badge</div>,
        icon: <FaFlag />,
        content: <SettingsPanel />,
        onDismount() {
            routerHook.removePatch("/library/app/:appid", libraryPatch);
        },
    };
});
