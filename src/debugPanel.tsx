// decky-ukr-badge/src/debugPanel.tsx
import React, { FC, useEffect, useState, useRef } from "react";
import {
    PanelSection,
    PanelSectionRow,
    ButtonItem,
    ToggleField,
    TextField,
    DropdownItem,
} from "@decky/ui";
import { callBackend } from "./hooks/useSettings";
import { useDebugSettings } from "./hooks/useDebugSettings";
import {
    fetchSteamGameLanguages,
    fetchKuliTranslationStatus,
    hasUkrainianSupport,
    urlifyGameName,
} from "./utils";

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

    // Mock Settings
    const { debugSettings, setMockMode, setMockStatus } = useDebugSettings();

    // Tester State
    const [testerInput, setTesterInput] = useState("The Witcher 3: Wild Hunt");
    const [testerResult, setTesterResult] = useState<string>("");

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

    // Auto refresh logs
    useEffect(() => {
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    // Scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop =
                logContainerRef.current.scrollHeight;
        }
    }, [logs]);

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
    ): Promise<void> => {
        try {
            const result = (await callBackend<CommandResult>(command)) as any;
            if (result && result.message) {
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
        await executeCommand(enabled ? "enable_ssh" : "disable_ssh");
        await fetchNetworkInfo();
    };

    const sshEnabled = networkInfo.ssh_status === "active";

    // Run Detection Test
    const runDetectionTest = async () => {
        setTesterResult("Running...");
        const logs: string[] = [];
        const log = (msg: string) => logs.push(msg);

        try {
            log(`Testing: "${testerInput}"`);
            log(`Slug: ${urlifyGameName(testerInput)}`);

            // Check Kuli
            log("Fetching Kuli status...");
            const kuliStatus = await fetchKuliTranslationStatus(testerInput);
            log(`Kuli Result: ${kuliStatus}`);

            // Cannot easily test Steam status without AppID, but we can try if input is digits
            if (/^\d+$/.test(testerInput)) {
                log(`Input looks like AppID. Fetching Steam langs...`);
                const steamLangs = await fetchSteamGameLanguages(testerInput);
                log(`Steam Langs: ${steamLangs?.join(", ") || "None/Error"}`);
                const hasSupport = steamLangs ? hasUkrainianSupport(steamLangs) : false;
                log(`Official Support: ${hasSupport}`);
            }

        } catch (e: any) {
            log(`Exception: ${e.message}`);
        }

        setTesterResult(logs.join("\n"));
    };

    const mockStatusOptions = [
        { data: 0, label: "Official", value: "OFFICIAL" },
        { data: 1, label: "Community", value: "COMMUNITY" },
        { data: 2, label: "None", value: "NONE" },
    ];

    const currentMockStatusIndex = mockStatusOptions.findIndex(o => o.value === debugSettings.mockStatus);

    return (
        <>
            {/* Mocking Section */}
            <PanelSection title="🎭 Mocking (UI Testing)">
                <PanelSectionRow>
                    <ToggleField
                        label="Enable Mock Mode"
                        description="Force badge status for all games"
                        checked={debugSettings.mockMode}
                        onChange={setMockMode}
                    />
                </PanelSectionRow>
                {debugSettings.mockMode && (
                    <PanelSectionRow>
                        <DropdownItem
                            label="Mock Status"
                            menuLabel="Mock Status"
                            rgOptions={mockStatusOptions}
                            selectedOption={currentMockStatusIndex !== -1 ? currentMockStatusIndex : 0}
                            onChange={(opt: any) => {
                                const option = mockStatusOptions.find(o => o.data === opt.data);
                                if (option) setMockStatus(option.value as any);
                            }}
                        />
                    </PanelSectionRow>
                )}
            </PanelSection>

            {/* Detection Tester */}
            <PanelSection title="🧪 Detection Tester">
                <PanelSectionRow>
                    <TextField
                        label="Game Name or AppID"
                        value={testerInput}
                        onChange={(e) => setTesterInput(e.target.value)}
                    />
                </PanelSectionRow>
                <PanelSectionRow>
                    <ButtonItem layout="below" onClick={runDetectionTest}>
                        Run Test
                    </ButtonItem>
                </PanelSectionRow>
                {testerResult && (
                    <PanelSectionRow>
                        <div style={{
                            backgroundColor: "#0d1117",
                            padding: "8px",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            whiteSpace: "pre-wrap"
                        }}>
                            {testerResult}
                        </div>
                    </PanelSectionRow>
                )}
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
                            height: "150px",
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
                                else if (log.includes("[WARN]")) color = "#d29922";
                                else if (log.includes("[DEBUG]")) color = "#8b949e";
                                else if (log.includes("[INFO]")) color = "#58a6ff";

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
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <div style={{ flex: 1 }}>
                            <ButtonItem
                                layout="below"
                                onClick={fetchLogs}
                                disabled={loading}
                            >
                                🔄 Refresh
                            </ButtonItem>
                        </div>
                        <div style={{ flex: 1 }}>
                            <ButtonItem
                                layout="below"
                                onClick={handleClearLogs}
                                disabled={loading}
                            >
                                🗑️ Clear
                            </ButtonItem>
                        </div>
                    </div>
                </PanelSectionRow>
            </PanelSection>

            {/* Network & System */}
            <PanelSection title="🔧 System Toolbox">
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
                            <span style={{ color: "#888" }}>IP:</span>
                            <span style={{ color: "#4fc3f7" }}>{networkInfo.ip}</span>

                            <span style={{ color: "#888" }}>SSH:</span>
                            <span style={{ color: sshEnabled ? "#4caf50" : "#f44336" }}>
                                {networkInfo.ssh_status} ({networkInfo.ssh_port})
                            </span>

                            <span style={{ color: "#888" }}>CEF:</span>
                            <span style={{ color: "#ffb74d" }}>
                                {networkInfo.cef_debug_url}
                            </span>
                        </div>
                    </div>
                </PanelSectionRow>

                <PanelSectionRow>
                    <ToggleField
                        label="SSH Server"
                        checked={sshEnabled}
                        onChange={handleSSHToggle}
                    />
                </PanelSectionRow>

                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => executeCommand("restart_decky")}
                    >
                        🔄 Restart Decky
                    </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", marginTop: "12px" }}>⚠️ Dangerous Zone</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: "120px" }}>
                            <ButtonItem
                                layout="below"
                                onClick={() => executeCommand("restart_steam")}
                            >
                                Restart Steam
                            </ButtonItem>
                        </div>
                        <div style={{ flex: 1, minWidth: "120px" }}>
                            <ButtonItem
                                layout="below"
                                onClick={() => executeCommand("restart_deck")}
                            >
                                Reboot Deck
                            </ButtonItem>
                        </div>
                    </div>
                </PanelSectionRow>
            </PanelSection>
        </>
    );
};
