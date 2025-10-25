/**
 * Runtime helpers abstract the differences between browser (Next.js) and
 * React Native / Node-like environments so that the SDK never directly
 * assumes that `window` or DOM APIs exist.
 */
export type GlobalScope = typeof globalThis & {
  relayerSDK?: unknown;
};

let cachedGlobalScope: GlobalScope | undefined;

/**
 * Returns the best-effort global scope (window in browsers, globalThis otherwise).
 */
export const getGlobalScope = (): GlobalScope | undefined => {
  if (cachedGlobalScope) return cachedGlobalScope;
  if (typeof window !== "undefined") {
    cachedGlobalScope = window as unknown as GlobalScope;
    return cachedGlobalScope;
  }
  if (typeof globalThis !== "undefined") {
    cachedGlobalScope = globalThis as GlobalScope;
    return cachedGlobalScope;
  }
  return undefined;
};

/**
 * True when DOM primitives are available. React Native ships without them,
 * so the SDK can pick a different loading strategy.
 */
export const hasDomAPIs = (): boolean => {
  return typeof document !== "undefined" && typeof document.createElement === "function";
};
