import type { FhevmConfig, FhevmChainConfig, ContractConfig } from "./types.js";
import type { Abi } from "abitype";

export type CreateConfigParameters = {
  chains: FhevmChainConfig[];
  contracts?: Record<string, ContractConfig>;
  relayer?: {
    baseUrl?: string;
    apiKey?: string;
    wasm?: {
      tfhe?: string;
      kms?: string;
    };
  };
  defaultMode?: "local" | "remote";
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
};

export function createConfig(parameters: CreateConfigParameters): FhevmConfig {
  const { chains, contracts, relayer, defaultMode = "local", cache } = parameters;

  if (!chains || chains.length === 0) {
    throw new Error("At least one chain must be provided");
  }

  return {
    chains,
    contracts: contracts || {},
    relayer,
    defaultMode,
    cache: {
      enabled: cache?.enabled ?? true,
      ttl: cache?.ttl ?? 60000, // 1 minute default
    },
  };
}

export function addContract<TAbi extends Abi>(
  config: FhevmConfig,
  name: string,
  contract: ContractConfig<TAbi>,
): FhevmConfig {
  return {
    ...config,
    contracts: {
      ...config.contracts,
      [name]: contract,
    },
  };
}

export function getContract(config: FhevmConfig, name: string): ContractConfig | undefined {
  return config.contracts?.[name];
}

export function getChain(config: FhevmConfig, chainId: number): FhevmChainConfig | undefined {
  return config.chains.find(chain => chain.id === chainId);
}
