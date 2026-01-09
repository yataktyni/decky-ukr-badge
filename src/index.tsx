// decky-ukr-badge/src/index.tsx
import React, { useEffect, useState, FC, ReactElement } from "react";
import { definePlugin, routerHook, call } from "@decky/api";
import { afterPatch, findInReactTree, wrapReactType } from "@decky/ui";
import {
  fetchSteamGameLanguages,
  fetchKuliTranslationStatus,
  hasUkrainianSupport,
  urlifyGameName,
  openInSteamBrowser,
  getSteamLanguage,
} from "./utils";
import { Settings, DEFAULT_SETTINGS, SettingsType } from "./settings";
import { t } from "./translations";
import { FaFlag } from "react-icons/fa";

const BADGE_STATES = {
  OFFICIAL: { text: "🇺🇦 🫡", color: "#28a745" },
  COMMUNITY: { text: "🇺🇦 🫂", color: "#ffc107" },
  NONE: { text: "🇺🇦 ❌", color: "#dc3545" },
} as const;

type BadgeStatus = keyof typeof BADGE_STATES;

const CACHE_KEY = "decky-ukr-badge-cache";
const CACHE_DURATION = 86400000; // 1 day in ms

interface CacheEntry {
  timestamp: number;
  status: BadgeStatus;
}

interface CacheData {
  [appId: string]: CacheEntry;
}

function getCache(): CacheData {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

function setCache(newCache: CacheData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
  } catch (e) {
    console.error("[decky-ukr-badge] Failed to save cache:", e);
  }
}

interface BadgeProps {
  appId: string;
  appName: string;
  settings: SettingsType;
}

const UAStatusBadge: FC<BadgeProps> = ({ appId, appName, settings }) => {
  const [status, setStatus] = useState<BadgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const lang = getSteamLanguage();

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      if (!appId) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cache = getCache();
      const cached = cache[appId];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setStatus(cached.status);
        setLoading(false);
        return;
      }

      try {
        // Step 1: Check Steam API for official Ukrainian support
        const steamLanguages = await fetchSteamGameLanguages(appId);
        if (
          !cancelled &&
          steamLanguages &&
          hasUkrainianSupport(steamLanguages)
        ) {
          setStatus("OFFICIAL");
          cache[appId] = { timestamp: Date.now(), status: "OFFICIAL" };
          setCache(cache);
          setLoading(false);
          return;
        }

        // Step 2: Check kuli.com.ua for community/official translations
        if (appName) {
          const kuliStatus = await fetchKuliTranslationStatus(appName);
          if (!cancelled && kuliStatus) {
            setStatus(kuliStatus);
            cache[appId] = { timestamp: Date.now(), status: kuliStatus };
            setCache(cache);
            setLoading(false);
            return;
          }
        }

        // No Ukrainian support found
        if (!cancelled) {
          setStatus("NONE");
          cache[appId] = { timestamp: Date.now(), status: "NONE" };
          setCache(cache);
        }
      } catch (e) {
        console.error("[decky-ukr-badge] Error fetching status:", e);
        if (!cancelled) {
          setStatus("NONE");
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [appId, appName]);

  if (loading || !status) {
    return null;
  }

  const badge = BADGE_STATES[status];
  const { badgePosition, offsetX, offsetY, badgeType } = settings;

  const positionStyles: React.CSSProperties = {
    position: "absolute",
    zIndex: 9999,
  };

  if (badgePosition === "top-left") {
    positionStyles.top = `${offsetY}px`;
    positionStyles.left = `${offsetX}px`;
  } else {
    // Default to top-right
    positionStyles.top = `${offsetY}px`;
    positionStyles.right = `${offsetX}px`;
  }

  const badgeStyle: React.CSSProperties = {
    ...positionStyles,
    backgroundColor: badge.color,
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: status !== "NONE" ? "pointer" : "default",
    color: status === "COMMUNITY" ? "#000" : "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    userSelect: "none",
  };

  const text =
    badgeType === "default"
      ? badge.text
      : `${badge.text} ${t("ukrainian", lang)}`;

  const handleClick = () => {
    if (status !== "NONE" && appName) {
      openInSteamBrowser(`https://kuli.com.ua/${urlifyGameName(appName)}`);
    }
  };

  const title =
    status === "OFFICIAL"
      ? t("ukrainian", lang) + " (Official)"
      : status === "COMMUNITY"
        ? t("ukrainian", lang) + " (Community)"
        : t("ukrainian", lang) + " (None)";

  return (
    <div
      style={badgeStyle}
      onClick={status !== "NONE" ? handleClick : undefined}
      title={title}
    >
      {text}
    </div>
  );
};

// Settings Panel Component for the Quick Access Menu
const SettingsPanel: FC = () => {
  return <Settings serverAPI={call} />;
};

// Store for current settings
let currentSettings: SettingsType = { ...DEFAULT_SETTINGS };

// Load settings from backend
async function loadSettings(): Promise<SettingsType> {
  try {
    const resp = (await call("get_settings")) as SettingsType;
    currentSettings = { ...DEFAULT_SETTINGS, ...resp };
    return currentSettings;
  } catch (e) {
    console.error("[decky-ukr-badge] Failed to load settings:", e);
    return DEFAULT_SETTINGS;
  }
}

// Patch storage for cleanup
let routePatch: ReturnType<typeof routerHook.addPatch> | null = null;

// Type definitions for route patching
interface RouteProps {
  path: string;
  children: ReactElement & {
    props: {
      renderFunc: (...args: unknown[]) => ReactElement;
    };
  };
}

interface ReactNode {
  props?: {
    className?: string;
    children?: ReactNode | ReactNode[];
  };
  type?: {
    type?: (...args: unknown[]) => ReactElement;
  };
}

export default definePlugin(() => {
  // Load settings on plugin init
  loadSettings();

  // Patch the app details page to inject our badge
  routePatch = routerHook.addPatch(
    "/library/app/:appid",
    (routeProps: RouteProps) => {
      afterPatch(
        routeProps.children.props,
        "renderFunc",
        (_: unknown[], ret: ReactElement) => {
          try {
            // Get appId from route
            const appId = routeProps.path?.match(/\/library\/app\/(\d+)/)?.[1];

            if (!appId) {
              return ret;
            }

            // Try to find the app name from Steam's data
            let appName = "";
            try {
              // Use type assertion to access Steam's internal appStore
              const appStore = (
                window as unknown as {
                  appStore?: {
                    GetAppOverviewByAppID?: (id: number) => {
                      display_name?: string;
                    };
                  };
                }
              ).appStore;
              if (appStore?.GetAppOverviewByAppID) {
                const overview = appStore.GetAppOverviewByAppID(
                  parseInt(appId, 10),
                );
                appName = overview?.display_name || "";
              }
            } catch {
              // Fallback - empty name
              appName = "";
            }

            // Wrap the return to inject our badge
            wrapReactType(ret);
            afterPatch(
              ret.type as unknown as {
                type: (...args: unknown[]) => ReactElement;
              },
              "type",
              (_: unknown[], innerRet: ReactElement) => {
                if (!innerRet?.props?.children) {
                  return innerRet;
                }

                // Find a suitable container to inject the badge
                const headerArea = findInReactTree(
                  innerRet,
                  (node: ReactNode) =>
                    node?.props?.className?.includes?.("appdetails") ||
                    node?.props?.className?.includes?.("Header"),
                );

                if (headerArea && headerArea.props) {
                  // Inject badge as a sibling with relative positioning
                  const originalChildren = headerArea.props.children;
                  headerArea.props.children = (
                    <>
                      <div style={{ position: "relative" }}>
                        <UAStatusBadge
                          appId={appId}
                          appName={appName}
                          settings={currentSettings}
                        />
                      </div>
                      {originalChildren as React.ReactNode}
                    </>
                  );
                } else {
                  // Fallback: prepend to the main content
                  const children = innerRet.props.children;
                  if (Array.isArray(children)) {
                    children.unshift(
                      <div
                        key="ukr-badge-container"
                        style={{ position: "relative", width: "100%" }}
                      >
                        <UAStatusBadge
                          appId={appId}
                          appName={appName}
                          settings={currentSettings}
                        />
                      </div>,
                    );
                  }
                }

                return innerRet;
              },
            );
          } catch (e) {
            console.error("[decky-ukr-badge] Error in route patch:", e);
          }
          return ret;
        },
      );
      return routeProps;
    },
  );

  return {
    name: "decky-ukr-badge",
    title: <div>Decky UKR Badge</div>,
    icon: <FaFlag />,
    content: <SettingsPanel />,
    onDismount: () => {
      // Cleanup route patch
      if (routePatch) {
        routerHook.removePatch("/library/app/:appid", routePatch);
        routePatch = null;
      }
    },
  };
});
