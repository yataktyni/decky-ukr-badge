// decky-ukr-badge/src/components/LinksSection.tsx
import React, { FC, useState, useEffect } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaSteam, FaYoutube, FaGithub, FaQrcode, FaGamepad, FaDownload, FaBitcoin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { call } from "@decky/api";
import { t } from "../translations";
import { logger } from "../logger";

const log = logger.component("LinksSection");

interface LinksSectionProps {
    lang: "en" | "uk";
    openUrl: (url: string) => void;
}

interface VersionInfo {
    current: string;
    latest: string | null;
    latest_tag?: string;
    update_available: boolean;
}

const generateQRCode = (url: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

const Divider: FC = () => (
    <div style={{
        width: "100%",
        height: "1px",
        background: "rgba(255,255,255,0.15)",
        margin: "16px 0"
    }} />
);

const LinkButton: FC<{ onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }> = ({ onClick, icon, label, disabled }) => (
    <PanelSectionRow>
        <ButtonItem layout="below" onClick={onClick} disabled={disabled}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                {icon}
                <span>{label}</span>
            </div>
        </ButtonItem>
    </PanelSectionRow>
);

export const LinksSection: FC<LinksSectionProps> = ({ lang, openUrl }) => {
    const cryptoUrl = "https://nowpayments.io/donation/yataktyni";

    const [showCryptoQR, setShowCryptoQR] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<{ msg: string; isError: boolean } | null>(null);
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

    // Check for updates on mount
    useEffect(() => {
        const checkVersion = async () => {
            // First, get current version immediately
            try {
                const current = await call<[], string>("get_current_version");
                setVersionInfo(prev => prev ? { ...prev, current } : {
                    current,
                    latest: null,
                    update_available: false
                });
            } catch (e) {
                log.warn("Failed to get immediate version:", e);
            }

            // Then check for latest on GitHub
            try {
                const info = await call<[], VersionInfo>("get_latest_version");
                log.info("Full version info:", info);
                setVersionInfo(info);
            } catch (e) {
                log.error("Failed to check version from GitHub:", e);
                // Preserve current version if we already fetched it
                setVersionInfo(prev => prev ? { ...prev, update_available: false } : {
                    current: "unknown",
                    latest: null,
                    update_available: false
                });
            }
        };
        checkVersion();
    }, []);

    const handleUpdate = async () => {
        log.info("Starting plugin update...");
        setUpdating(true);
        setUpdateStatus(null);

        // Timeout to prevent getting stuck in "updating..." state
        const timeoutId = setTimeout(() => {
            log.error("Update timed out after 60 seconds");
            setUpdating(false);
            setUpdateStatus({ msg: t("update_error", lang) + ": Timeout", isError: true });
        }, 120000);

        try {
            const result = await call<[], { success: boolean; message?: string; error?: string; already_current?: boolean; needs_restart?: boolean }>("update_plugin");
            clearTimeout(timeoutId);
            log.info("Update result:", result);
            if (result.success) {
                if (result.already_current) {
                    setUpdateStatus({ msg: t("already_up_to_date", lang), isError: false });
                } else {
                    setUpdateStatus({
                        msg: `${t("update_success", lang)} - ${t("restart_to_apply", lang)}`,
                        isError: false
                    });
                    // Refresh version info after update
                    const info = await call<[], VersionInfo>("get_latest_version");
                    setVersionInfo(info);
                }
            } else {
                log.error("Update failed:", result.error);
                setUpdateStatus({
                    msg: t("update_error", lang) + (result.error ? `: ${result.error}` : ""),
                    isError: true
                });
            }
        } catch (e) {
            clearTimeout(timeoutId);
            log.error("Update exception:", e);
            setUpdateStatus({
                msg: t("update_error", lang) + (e instanceof Error ? `: ${e.message}` : ""),
                isError: true
            });
        } finally {
            setUpdating(false);
        }
    };

    const getUpdateButtonLabel = () => {
        if (updating) return t("updating", lang);
        if (versionInfo?.update_available && versionInfo.latest_tag) {
            return `${t("update_to", lang)} ${versionInfo.latest_tag}`;
        }
        const versionToShow = versionInfo?.latest || versionInfo?.current;
        return `${t("update_plugin", lang)}${versionToShow ? ` (v${versionToShow})` : ""}`;
    };

    return (
        <PanelSection title={`🔗 ${t("links", lang)}`}>
            {/* Crypto Support */}
            <PanelSectionRow>
                <div style={{ padding: "0 4px 8px 4px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 10px" }}>
                        <div style={{ background: "#F7931A", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaBitcoin size={14} color="white" />
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>{t("crypto_support", lang)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", padding: "0 10px" }}>
                        <button onClick={() => openUrl(cryptoUrl)} style={{ flex: 1, background: "#F7931A", boxShadow: "0 4px 12px rgba(247, 147, 26, 0.3)", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 12px", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}>{t("donate", lang)}</button>
                        <button onClick={() => setShowCryptoQR(!showCryptoQR)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 14px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <FaQrcode size={18} />
                        </button>
                    </div>
                    {showCryptoQR && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "12px", background: "#fff", borderRadius: "8px", marginTop: "12px", marginLeft: "10px", marginRight: "10px" }}>
                            <img src={generateQRCode(cryptoUrl)} alt="Crypto QR Code" style={{ width: "140px", height: "140px" }} />
                        </div>
                    )}
                </div>
            </PanelSectionRow>

            {/* Divider after donations */}
            <Divider />

            {/* Info Links */}
            <LinkButton onClick={() => openUrl("https://kuli.com.ua/")} icon={<FaGamepad />} label={t("kuli_website", lang)} />
            <LinkButton onClick={() => openUrl("https://www.youtube.com/watch?v=24gxXddKNv0")} icon={<FaYoutube />} label={t("video_guide", lang)} />
            <LinkButton onClick={() => openUrl("https://steamcommunity.com/sharedfiles/filedetails/?id=3137617136")} icon={<FaSteam />} label={t("text_guide", lang)} />
            <LinkButton onClick={() => openUrl("https://github.com/yataktyni/decky-ukr-badge")} icon={<FaGithub />} label={t("github_source", lang)} />
            <LinkButton onClick={() => openUrl("https://x.com/yataktyni")} icon={<FaXTwitter />} label={t("author_x", lang)} />

            {/* Divider after info links */}
            <Divider />

            {/* Update Section */}
            <LinkButton
                onClick={handleUpdate}
                icon={<FaDownload />}
                label={getUpdateButtonLabel()}
                disabled={updating}
            />

            {/* Update Status Message (inline below button) */}
            {updateStatus && (
                <PanelSectionRow>
                    <div style={{
                        textAlign: "center",
                        fontSize: "11px",
                        marginTop: "4px",
                        marginLeft: "-4px",
                        marginBottom: "4px",
                        color: !updateStatus.isError ? "#4ade80" : "#f87171",
                        fontWeight: "bold",
                        width: "100%"
                    }}>
                        {!updateStatus.isError ? "✅" : "❌"} {updateStatus.msg}
                    </div>
                </PanelSectionRow>
            )}

            {/* Version Display (always at bottom) */}
            {versionInfo && (
                <div style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.35)",
                    marginTop: "4px",
                    paddingBottom: "8px"
                }}>
                    v{versionInfo.current}
                    {versionInfo.update_available && versionInfo.latest_tag && (
                        <span style={{ color: "#4ade80", marginLeft: "8px" }}>
                            → {versionInfo.latest_tag}
                        </span>
                    )}
                </div>
            )}
        </PanelSection>
    );
};
