// decky-ukr-badge/src/components/LinksSection.tsx
import React, { FC } from "react";
import { PanelSection, ButtonItem } from "@decky/ui";
import { FaSteam, FaYoutube, FaGithub, FaGamepad } from "react-icons/fa";
import { t } from "../translations";

interface LinksSectionProps {
    lang: "en" | "uk";
    openUrl: (url: string) => void;
}

export const LinksSection: FC<LinksSectionProps> = ({ lang, openUrl }) => {
    return (
        <PanelSection title={`🔗 ${t("links", lang)}`}>
            <ButtonItem layout="below" onClick={() => openUrl("https://kuli.com.ua/")}>
                Kuli.com.ua
            </ButtonItem>
            <ButtonItem layout="below" onClick={() => openUrl("https://www.youtube.com/watch?v=24gxXddKNv0")}>
                {t("video_guide", lang)}
            </ButtonItem>
            <ButtonItem layout="below" onClick={() => openUrl("https://steamcommunity.com/sharedfiles/filedetails/?id=3137617136")}>
                {t("text_guide", lang)}
            </ButtonItem>
            <ButtonItem layout="below" onClick={() => openUrl("https://github.com/yataktyni/decky-ukr-badge")}>
                GitHub Source
            </ButtonItem>
        </PanelSection>
    );
};
