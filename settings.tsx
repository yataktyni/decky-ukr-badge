// decky-ukr-badge/settings.tsx
import { PanelSection, PanelSectionRow, ButtonItem, DropdownItem, SliderField } from "decky-frontend-lib";
import { useState } from "react";
import { clearCache } from "./main";
import { t } from "./translations";

export const Settings = () => {
    const [badgeType, setBadgeType] = useState("full");
    const [badgePosition, setBadgePosition] = useState("top-right");
    const [offsetX, setOffsetX] = useState(10);
    const [offsetY, setOffsetY] = useState(10);

    return (
        <PanelSection title={t("settings_title")}>
            <PanelSectionRow>
                <DropdownItem
                    label={t("badge_type")}
                    description={t("badge_type_caption")}
                    rgOptions={[
                        { label: t("type_default"), value: "default" },
                        { label: t("type_full"), value: "full" },
                    ]}
                    selectedOption={badgeType}
                    onChange={(value) => setBadgeType(value)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <DropdownItem
                    label={t("badge_position")}
                    description={t("badge_position_caption")}
                    rgOptions={[
                        { label: t("top_left"), value: "top-left" },
                        { label: t("top_right"), value: "top-right" },
                    ]}
                    selectedOption={badgePosition}
                    onChange={(value) => setBadgePosition(value)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <SliderField
                    label="X Offset"
                    value={offsetX}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(value) => setOffsetX(value)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <SliderField
                    label="Y Offset"
                    value={offsetY}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(value) => setOffsetY(value)}
                />
            </PanelSectionRow>
            <PanelSectionRow>
                <ButtonItem layout="below" onClick={clearCache}>
                    {t("clear_cache")}
                </ButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
                <a href="https://ko-fi.com/YOUR_KOFI_NAME" target="_blank">
                    ❤️ Ko-fi
                </a>
            </PanelSectionRow>
            <PanelSectionRow>
                <a href="https://github.com/yataktyni/decky-ukr-badge" target="_blank">
                    📦 GitHub
                </a>
            </PanelSectionRow>
        </PanelSection>
    );
};
