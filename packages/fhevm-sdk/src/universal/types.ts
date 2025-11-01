import type { Abi } from "abitype";
import type { RemoteFheClient } from "../remote/index.js";
import type { FhevmInstance } from "../fhevmTypes.js";
import type { Eip1193Provider, ethers } from "ethers";

export type FheContractConfig = {
  address: `0x${string}`;
  abi: Abi;
  name?: string;
};

export type RemoteModeConfig = {
  mode?: "remote";
  signer: ethers.Signer;
  relayer?: {
    baseUrl?: string;
    apiKey?: string;
    wasm?: {
      tfhe?: string;
      kms?: string;
    };
  };
};

export type LocalModeConfig = {
  mode: "local";
  provider: string | Eip1193Provider;
  signer: ethers.Signer;
  chainId?: number;
  mockChains?: Record<number, string>;
  wasm?: {
    tfhe?: string;
    kms?: string;
  };
};

export type CreateFheClientOptions = {
  contract: FheContractConfig;
} & (RemoteModeConfig | LocalModeConfig);

export type FheClientReadResponse = { handle: string; value: string };
export type FheClientMutateResponse = { txHash: string; blockNumber: number };

export type FheClient = {
  mode: "remote" | "local";
  contract: FheContractConfig;
  read: (functionName?: string) => Promise<FheClientReadResponse>;
  mutate: (params: { functionName: string; values: number[] }) => Promise<FheClientMutateResponse>;
  metadata?: {
    relayerBaseUrl?: string;
    sessionId?: string;
    authorizationPublicKey?: string;
  };
  [Symbol.asyncDispose]?: () => Promise<void>;
};

export type RemoteController = {
  remote: RemoteFheClient;
};

export type LocalController = {
  getInstance: () => Promise<FhevmInstance>;
  signer: ethers.Signer;
  contract: ethers.Contract;
};
