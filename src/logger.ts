// decky-ukr-badge/src/logger.ts
// Structured frontend logger for CEF debugging

const PREFIX = "[decky-ukr-badge]";

export const logger = {
    info: (...args: unknown[]) => console.log(PREFIX, ...args),
    warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
    error: (...args: unknown[]) => console.error(PREFIX, ...args),
    debug: (...args: unknown[]) => console.debug(PREFIX, ...args),

    // Log with context (useful for component-specific logs)
    component: (name: string) => ({
        info: (...args: unknown[]) => console.log(`${PREFIX} [${name}]`, ...args),
        warn: (...args: unknown[]) => console.warn(`${PREFIX} [${name}]`, ...args),
        error: (...args: unknown[]) => console.error(`${PREFIX} [${name}]`, ...args),
        debug: (...args: unknown[]) => console.debug(`${PREFIX} [${name}]`, ...args),
    }),
};
