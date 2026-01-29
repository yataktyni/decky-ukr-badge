import React, { FC, useState } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaSteam, FaYoutube, FaGithub, FaCopy, FaCheck } from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { t } from "../translations";

interface LinksSectionProps {
    lang: "en" | "uk";
    openUrl: (url: string) => void;
}

const LinkButton: FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({ onClick, icon, label }) => (
    <PanelSectionRow>
        <ButtonItem layout="below" onClick={onClick}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                {icon}
                <span>{label}</span>
            </div>
        </ButtonItem>
    </PanelSectionRow>
);

export const LinksSection: FC<LinksSectionProps> = ({ lang, openUrl }) => {
    const kofiUrl = "https://ko-fi.com/yataktyni/tip";
    const instructionUrl = "https://www.youtube.com/watch?v=24gxXddKNv0";
    const steamGuideUrl = "https://steamcommunity.com/sharedfiles/filedetails/?id=3137617136";
    const githubUrl = "https://github.com/yataktyni/decky-ukr-badge";
    const usdtAddress = "TP63PYsRk3H9JypuHhqmfpwyCqBYyLBxQL";

    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(usdtAddress).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <PanelSection title={`🔗 ${t("links", lang)}`}>
            {/* Ko-fi Support Row */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                gap: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "12px",
                margin: "0 10px 10px 10px",
                border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ backgroundColor: "#FF5E5B", padding: "8px", borderRadius: "50%", display: "flex" }}>
                        <svg height="20" width="20" viewBox="0 0 24 24" fill="white">
                            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 5.422-2.721 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-4.417-2.924-5.466-2.937-5.408-.267-.059 1.941-1.42 2.613-2.193.376-.433.973-.243.973-.243s.694-.239 1.139.298c1.328 1.602 2.766 2.368 2.641 3.637zm5.467 1.258c-.792 1.34-2.887 1.229-2.887 1.229V6.366s1.611-.08 2.559.576c1.378.956 1.121 2.809.328 3.264z" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>UA Badge</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{t("support_on_kofi", lang)}</div>
                    </div>
                </div>
                <button
                    style={{
                        backgroundColor: "#FF5E5B",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        padding: "6px 16px",
                        fontWeight: 800,
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(255, 94, 91, 0.3)",
                        cursor: "pointer"
                    }}
                    onClick={() => openUrl(kofiUrl)}
                >
                    Donate
                </button>
            </div>

            {/* USDT TRC20 Support Row */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px",
                gap: "10px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "12px",
                margin: "0 10px 10px 10px",
                border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ backgroundColor: "#26A17B", padding: "8px", borderRadius: "50%", display: "flex" }}>
                            <SiTether size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>USDT (TRC20)</div>
                            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{usdtAddress}</div>
                        </div>
                    </div>
                    <button
                        style={{
                            backgroundColor: copied ? "#28a745" : "rgba(255, 255, 255, 0.1)",
                            color: "white",
                            border: "none",
                            borderRadius: "20px",
                            padding: "6px 12px",
                            fontWeight: 800,
                            fontSize: "11px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                        onClick={copyToClipboard}
                    >
                        {copied ? <FaCheck /> : <FaCopy />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            </div>

            <LinkButton
                onClick={() => openUrl("https://kuli.com.ua/")}
                icon={<span style={{ fontSize: "20px" }}>🇺🇦</span>}
                label="Kuli.com.ua"
            />
            <LinkButton
                onClick={() => openUrl(instructionUrl)}
                icon={<FaYoutube color="#FF0000" size={20} />}
                label={t("video_guide", lang)}
            />
            <LinkButton
                onClick={() => openUrl(steamGuideUrl)}
                icon={<FaSteam color="#1b2838" size={20} />}
                label={t("text_guide", lang)}
            />
            <LinkButton
                onClick={() => openUrl(githubUrl)}
                icon={<FaGithub size={20} />}
                label="GitHub Source"
            />
        </PanelSection>
    );
};
