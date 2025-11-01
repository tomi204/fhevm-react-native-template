"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { FhevmConfig, FhevmState, DecryptCacheStore } from "./types.js";
import type { FhevmInstance } from "../fhevmTypes.js";
import { createFhevmInstance } from "../internal/fhevm.js";
import { ethers } from "ethers";

type FhevmContextValue = {
  config: FhevmConfig;
  state: FhevmState;
  instance: FhevmInstance | undefined;
  decryptCache: DecryptCacheStore;
  updateState: (updates: Partial<FhevmState>) => void;
  clearCache: () => void;
};

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

export type FhevmProviderProps = {
  config: FhevmConfig;
  children: ReactNode;
  initialChainId?: number;
};

export function FhevmProvider({ config, children, initialChainId }: FhevmProviderProps) {
  const [state, setState] = useState<FhevmState>({
    config,
    chainId: initialChainId,
  });

  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [decryptCache] = useState<DecryptCacheStore>(new Map());

  const updateState = useCallback((updates: Partial<FhevmState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearCache = useCallback(() => {
    decryptCache.clear();
  }, [decryptCache]);

  // Initialize FHEVM instance when provider/chainId changes
  useEffect(() => {
    console.log("🏭 FHEVM Instance Initializer:", {
      hasEip1193Provider: !!state.eip1193Provider,
      chainId: state.chainId,
      account: state.account,
    });

    if (!state.eip1193Provider) {
      console.log("⚠️ No eip1193Provider, skipping instance creation");
      setInstance(undefined);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    const mockChains = state.config.chains
      .filter(chain => chain.isMock)
      .reduce((acc, chain) => ({ ...acc, [chain.id]: chain.rpcUrl }), {} as Record<number, string>);

    console.log("🔨 Creating FHEVM instance with mockChains:", mockChains);

    createFhevmInstance({
      provider: state.eip1193Provider,
      mockChains: Object.keys(mockChains).length > 0 ? mockChains : undefined,
      signal: abortController.signal,
      wasm: state.config.relayer?.wasm,
    })
      .then(newInstance => {
        if (!cancelled) {
          console.log("✅ FHEVM instance created successfully!");
          setInstance(newInstance);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("❌ Failed to create FHEVM instance:", err);
          setInstance(undefined);
        }
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [state.eip1193Provider, state.chainId, state.config.chains]);

  // Clear cache when account or chainId changes
  useEffect(() => {
    clearCache();
  }, [state.account, state.chainId]);

  const value: FhevmContextValue = {
    config,
    state,
    instance,
    decryptCache,
    updateState,
    clearCache,
  };

  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>;
}

export function useFhevmContext() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error("useFhevmContext must be used within FhevmProvider");
  }
  return context;
}

// Hook to sync with wagmi or other wallet providers
export function useSyncWithWallet(params: {
  chainId?: number;
  address?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
  eip1193Provider?: unknown;
}) {
  const { updateState } = useFhevmContext();
  const { chainId, address, signer, provider, eip1193Provider } = params;

  useEffect(() => {
    const fromWindow = typeof window !== "undefined" ? (window as any).ethereum : undefined;
    const fromProvider =
      provider && typeof (provider as any).send === "function"
        ? {
            request: async ({ method, params }: { method: string; params?: unknown[] }) => {
              return (provider as any).send(method, params ?? []);
            },
          }
        : undefined;

    const effectiveEip1193 = eip1193Provider ?? fromWindow ?? fromProvider;

    console.log("📡 useSyncWithWallet updating state:", {
      chainId,
      address,
      hasSigner: !!signer,
      hasProvider: !!provider,
      hasEip1193Provider: !!effectiveEip1193,
    });

    const updates = {
      chainId,
      account: address,
      signer,
      provider,
      eip1193Provider: effectiveEip1193,
    };

    console.log("📡 Calling updateState with:", updates);
    updateState(updates);
  }, [chainId, address, signer, provider, eip1193Provider, updateState]);
}
