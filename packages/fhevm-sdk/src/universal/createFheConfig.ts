import type { CreateFheClientOptions } from "./types.js";

/**
 * Thin helper to mirror wagmi's `createConfig`.
 * Consumers can build their FHE client config once and share it across providers.
 */
export const createFheConfig = (options: CreateFheClientOptions) => options;
