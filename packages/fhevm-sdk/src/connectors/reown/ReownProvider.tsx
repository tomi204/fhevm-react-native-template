"use client";

import React, { ReactNode, useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider, useAccount, useWalletClient } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFhevmContext, useSyncWithWallet } from "../../config/FhevmProvider.js";
// @ts-ignore - Optional peer dependency
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { ethers } from "ethers";

const queryClient = new QueryClient();

export type ReownProviderProps = {
  children: ReactNode;
  wagmiAdapter: WagmiAdapter;
  projectId: string;
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
};

// Internal component that syncs wallet state with FHEVM
function FhevmWalletSync() {
  const [mounted, setMounted] = React.useState(false);
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = React.useState<ethers.Signer | undefined>(undefined);
  const [provider, setProvider] = React.useState<ethers.Provider | undefined>(undefined);
  const eip1193 = React.useMemo(() => {
    if (!walletClient) return undefined;
    if (typeof walletClient.request !== "function") return undefined;
    return {
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        return walletClient.request({
          method: method as any,
          params: (params ?? []) as any,
        });
      },
    } as any;
  }, [walletClient]);

  // Only render on client side to avoid SSR context issues
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (walletClient) {
      const ethersProvider = new ethers.BrowserProvider(walletClient as any);
      setProvider(ethersProvider);
      ethersProvider.getSigner().then(setSigner);
    } else {
      setSigner(undefined);
      setProvider(undefined);
    }
  }, [walletClient]);

  // Always call the hook, but pass mounted state to control sync
  useSyncWithWallet({
    chainId,
    address,
    signer,
    provider,
    eip1193Provider: eip1193,
  });

  return null;
}

export function ReownProvider({ children, wagmiAdapter, projectId, metadata }: ReownProviderProps) {
  useEffect(() => {
    // Initialize AppKit only on client side
    if (typeof window !== "undefined") {
      createAppKit({
        adapters: [wagmiAdapter as any],
        projectId,
        networks: wagmiAdapter.wagmiConfig.chains as any,
        metadata: metadata || {
          name: "FHE dApp",
          description: "Fully Homomorphic Encryption Application",
          url: "https://fhevm.io",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
        features: {
          analytics: true,
        },
      } as any);
    }
  }, [wagmiAdapter, projectId, metadata]);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FhevmWalletSync />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
