// decky-ukr-badge/src/debugPanel.tsx
import React, { FC, useEffect, useState, useRef } from "react";
import {
    PanelSection,
    PanelSectionRow,
    ButtonItem,
    ToggleField,
} from "@decky/ui";
import { callBackend } from "./hooks/useSettings";

interface NetworkInfo {
    ip: string;
    ssh_status: string;
    ssh_port: number;
    cef_debug_port: number;
    cef_debug_url: string;
}

interface CommandResult {
    success: boolean;
    message: string;
}

export const DebugPanel: FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
        ip: "unknown",
        ssh_status: "unknown",
        ssh_port: 22,
        cef_debug_port: 8080,
        cef_debug_url: "unknown",
    });
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Fetch logs from backend
    const fetchLogs = async () => {
        try {
            const result = await callBackend<string[]>("get_logs");
            setLogs(result || []);
        } catch (e) {
            console.error("[decky-ukr-badge] Failed to fetch logs:", e);
        }
    };

    // Fetch network info
    const fetchNetworkInfo = async () => {
        setLoading(true);
        try {
            const result = await callBackend<NetworkInfo>("get_network_info");
            if (result) {
                setNetworkInfo(result);
            }
        } catch (e) {
            console.error("[decky-ukr-badge] Failed to fetch network info:", e);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchLogs();
        fetchNetworkInfo();
    }, []);

    // ... (rest of log logic irrelevant to blocking) ...

    // Clear logs
    const handleClearLogs = async () => {
        try {
            await callBackend<boolean>("clear_logs");
            setLogs([]);
        } catch (e) {
            console.error("[decky-ukr-badge] Failed to clear logs:", e);
        }
    };

    // Generic command handler
    const executeCommand = async (
        command: string,
        confirmMessage?: string,
    ): Promise<void> => {
        if (confirmMessage && !confirm(confirmMessage)) {
            return;
        }

        // Don't set global loading for commands to avoid freezing UI
        try {
            const result = await callBackend<CommandResult>(command);
            if (result.message) {
                console.log(`[decky-ukr-badge] ${command}: ${result.message}`);
                // Add to local logs immediately for feedback
                setLogs((prev) => [...prev, `[CMD] ${result.message}`]);
            }
            // Refresh logs after command
            await fetchLogs();
        } catch (e) {
            console.error(`[decky-ukr-badge] ${command} failed:`, e);
            setLogs((prev) => [...prev, `[CMD][ERROR] ${command} failed`]);
        }
    };

    // SSH toggle
    const handleSSHToggle = async (enabled: boolean) => {
        // Optimistic update? No, safer to wait, but don't block
        await executeCommand(enabled ? "enable_ssh" : "disable_ssh");
        await fetchNetworkInfo();
    };

    const sshEnabled = networkInfo.ssh_status === "active";

    return (
        <>
            {/* Network & Debug Info */}
            <PanelSection title="🔧 Debug Info">
                <PanelSectionRow>
                    <div
                        style={{
                            backgroundColor: "#1a1a2e",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "12px",
                            fontFamily: "monospace",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr",
                                gap: "4px 12px",
                            }}
                        >
                            <span style={{ color: "#888" }}>IP Address:</span>
                            <span style={{ color: "#4fc3f7" }}>
                                {networkInfo.ip}
                            </span>

                            <span style={{ color: "#888" }}>SSH Status:</span>
                            <span
                                style={{
                                    color: sshEnabled ? "#4caf50" : "#f44336",
                                }}
                            >
                                {networkInfo.ssh_status}
                            </span>

                            <span style={{ color: "#888" }}>SSH Port:</span>
                            <span style={{ color: "#fff" }}>
                                {networkInfo.ssh_port}
                            </span>

                            <span style={{ color: "#888" }}>CEF Debug:</span>
                            <span style={{ color: "#ffb74d" }}>
                                {networkInfo.cef_debug_url}
                            </span>
                        </div>

                        {networkInfo.ip !== "unknown" && (
                            <div
                                style={{
                                    marginTop: "12px",
                                    padding: "8px",
                                    backgroundColor: "#0d1117",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                }}
                            >
                                <div
                                    style={{
                                        color: "#888",
                                        marginBottom: "4px",
                                    }}
                                >
                                    SSH Command:
                                </div>
                                <code style={{ color: "#7ee787" }}>
                                    ssh deck@{networkInfo.ip}
                                </code>
                            </div>
                        )}
                    </div>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ToggleField
                        label="SSH Enabled"
                        description="Enable/disable SSH server"
                        checked={sshEnabled}
                        onChange={handleSSHToggle}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => fetchNetworkInfo()}
                    >
                        {loading ? "🔄 Refreshing..." : "🔄 Refresh Network Info"}
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>

            {/* System Controls */}
            <PanelSection title="⚡ System Controls">
                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => executeCommand("restart_decky")}
                    >
                        🔄 Restart Decky
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() =>
                            executeCommand(
                                "restart_steam",
                                "This will restart Steam. Continue?",
                            )
                        }
                    >
                        🎮 Restart Steam
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() =>
                            executeCommand(
                                "disable_decky_temporarily",
                                "This will disable Decky until next reboot. Continue?",
                            )
                        }
                    >
                        ⏸️ Disable Decky (until reboot)
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() =>
                            executeCommand(
                                "restart_deck",
                                "This will restart your Steam Deck. Continue?",
                            )
                        }
                    >
                        🔌 Restart Steam Deck
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>

            {/* Console Logs */}
            <PanelSection title="📋 Console Logs">
                <PanelSectionRow>
                    <ToggleField
                        label="Auto-refresh"
                        description="Refresh logs every 2 seconds"
                        checked={autoRefresh}
                        onChange={setAutoRefresh}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <div
                        ref={logContainerRef}
                        style={{
                            backgroundColor: "#0d1117",
                            borderRadius: "8px",
                            padding: "8px",
                            height: "200px",
                            overflowY: "auto",
                            fontFamily: "monospace",
                            fontSize: "10px",
                            lineHeight: "1.4",
                        }}
                    >
                        {logs.length === 0 ? (
                            <div style={{ color: "#666", fontStyle: "italic" }}>
                                No logs yet...
                            </div>
                        ) : (
                            logs.map((log, index) => {
                                let color = "#c9d1d9";
                                if (log.includes("[ERROR]")) color = "#f85149";
                                else if (log.includes("[WARN]"))
                                    color = "#d29922";
                                else if (log.includes("[DEBUG]"))
                                    color = "#8b949e";
                                else if (log.includes("[INFO]"))
                                    color = "#58a6ff";

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            color,
                                            borderBottom: "1px solid #21262d",
                                            padding: "2px 0",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {log}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={fetchLogs}
                        disabled={loading}
                    >
                        🔄 Refresh Logs
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={handleClearLogs}
                        disabled={loading}
                    >
                        🗑️ Clear Logs
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
        </>
    );
};
