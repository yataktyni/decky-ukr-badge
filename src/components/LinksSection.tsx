// decky-ukr-badge/src/components/LinksSection.tsx
import React, { FC, useState } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaSteam, FaYoutube, FaGithub, FaQrcode, FaGamepad } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiTether } from "react-icons/si";
import { t } from "../translations";

interface LinksSectionProps {
    lang: "en" | "uk";
    openUrl: (url: string) => void;
}

const generateQRCode = (url: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

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
    const usdtAddress = "TP63PYsRk3H9JypuHhqmfpwyCqBYyLBxQL";

    const [showKofiQR, setShowKofiQR] = useState(false);
    const [showUsdtQR, setShowUsdtQR] = useState(false);

    return (
        <PanelSection title={`🔗 ${t("links", lang)}`}>
            {/* Ko-fi Support */}
            <PanelSectionRow>
                <div style={{ padding: "0 4px 8px 4px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 10px" }}>
                        <svg height="20" width="20" viewBox="0 0 24 24" fill="#FF5E5B">
                            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 5.422-2.721 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-4.417-2.924-5.466-2.937-5.466-.267-.059 1.941-1.42 2.613-2.193.376-.433.973-.243.973-.243s.694-.239 1.139.298c1.328 1.602 2.766 2.368 2.641 3.637zm5.467 1.258c-.792 1.34-2.887 1.229-2.887 1.229V6.366s1.611-.08 2.559.576c1.378.956 1.121 2.809.328 3.264z" />
                        </svg>
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>{t("support_on_kofi", lang)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", padding: "0 10px" }}>
                        <button onClick={() => openUrl(kofiUrl)} style={{ flex: 1, background: "#FF5E5B", boxShadow: "0 4px 12px rgba(255, 94, 91, 0.3)", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 12px", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}>{t("donate", lang)}</button>
                        <button onClick={() => setShowKofiQR(!showKofiQR)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <FaQrcode size={18} />
                        </button>
                    </div>
                    {showKofiQR && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "12px", background: "#fff", borderRadius: "8px", marginTop: "12px", marginLeft: "10px", marginRight: "10px" }}>
                            <img src={generateQRCode(kofiUrl)} alt="Ko-fi QR Code" style={{ width: "140px", height: "140px" }} />
                        </div>
                    )}
                </div>
            </PanelSectionRow>

            {/* USDT Support */}
            <PanelSectionRow>
                <div style={{ padding: "0 4px 8px 4px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", marginTop: "4px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 10px" }}>
                        <div style={{ background: "#26A17B", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <SiTether size={20} color="white" />
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>{t("usdt_support", lang)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", padding: "0 10px" }}>
                        <button onClick={() => setShowUsdtQR(!showUsdtQR)} style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", fontWeight: 700 }}>
                            <FaQrcode size={18} />
                            <span style={{ fontSize: "13px" }}>{t("show_qr_code", lang)}</span>
                        </button>
                    </div>
                    {showUsdtQR && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px", background: "#fff", borderRadius: "8px", marginTop: "12px", marginLeft: "10px", marginRight: "10px" }}>
                            <img src={generateQRCode(usdtAddress)} alt="USDT TRC20 QR Code" style={{ width: "140px", height: "140px" }} />
                            <div style={{ marginTop: "10px", color: "#333", fontSize: "10px", wordBreak: "break-all", textAlign: "center", fontWeight: "bold" }}>
                                {usdtAddress}
                            </div>
                        </div>
                    )}
                </div>
            </PanelSectionRow>

            <LinkButton onClick={() => openUrl("https://kuli.com.ua/")} icon={<FaGamepad />} label={t("kuli_website", lang)} />
            <LinkButton onClick={() => openUrl("https://www.youtube.com/watch?v=24gxXddKNv0")} icon={<FaYoutube />} label={t("video_guide", lang)} />
            <LinkButton onClick={() => openUrl("https://steamcommunity.com/sharedfiles/filedetails/?id=3137617136")} icon={<FaSteam />} label={t("text_guide", lang)} />
            <LinkButton onClick={() => openUrl("https://github.com/yataktyni/decky-ukr-badge")} icon={<FaGithub />} label={t("github_source", lang)} />
            <LinkButton onClick={() => openUrl("https://x.com/yataktyni")} icon={<FaXTwitter />} label={t("author_x", lang)} />
        </PanelSection>
    );
};
