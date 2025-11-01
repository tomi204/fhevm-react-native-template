import type { Abi } from "abitype";
import type { ethers } from "ethers";

export type FhevmChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  isMock?: boolean;
  contracts?: Record<string, ContractConfig>;
};

export type ContractConfig<TAbi extends Abi = Abi> = {
  address: `0x${string}`;
  abi: TAbi;
  name?: string;
};

export type FhevmConfig = {
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
    ttl?: number; // Time to live in milliseconds
  };
};

export type FhevmState = {
  config: FhevmConfig;
  chainId?: number;
  account?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
  eip1193Provider?: any;
};

export type DecryptCache = {
  value: string | bigint | boolean;
  timestamp: number;
  chainId: number;
  account: string;
};

export type DecryptCacheStore = Map<string, DecryptCache>;
