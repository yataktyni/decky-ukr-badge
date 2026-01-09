// decky-ukr-badge/src/hooks/useParams.ts
import { ReactRouter } from "@decky/ui";

/**
 * Hook to get route parameters from React Router.
 * This finds the useParams function from ReactRouter by matching its signature.
 * Based on ProtonDB Badges implementation.
 */
export const useParams = Object.values(ReactRouter).find((val) =>
    /return (\w)\?\1\.params:{}/.test(`${val}`)
) as <T>() => T;
