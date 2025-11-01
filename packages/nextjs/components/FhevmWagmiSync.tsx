"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSyncWithWallet } from "fhevm-sdk";
import { ethers } from "ethers";

export function FhevmWagmiSync() {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.Provider | undefined>(undefined);
  const eip1193 = useMemo(() => {
    if (!walletClient) return undefined;
    if (typeof walletClient.request !== "function") return undefined;
    return {
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        return walletClient.request({
          // Cast for compatibility with viem transport typings
          method: method as any,
          params: (params ?? []) as any,
        });
      },
    } as any;
  }, [walletClient]);

  useEffect(() => {
    if (walletClient && isConnected) {
      const ethersProvider = new ethers.BrowserProvider(walletClient as any);
      setProvider(ethersProvider);

      // Get signer asynchronously
      ethersProvider.getSigner().then((s) => {
        console.log("✅ Signer ready:", s);
        setSigner(s);
      }).catch((err) => {
        console.error("❌ Failed to get signer:", err);
        setSigner(undefined);
      });
    } else {
      console.log("🔌 Wallet disconnected, clearing signer/provider");
      setSigner(undefined);
      setProvider(undefined);
    }
  }, [walletClient, isConnected]);

  // Log sync state with more detail
  useEffect(() => {
    if (signer && provider) {
      console.log("✅ FHEVM Sync - Ready to sync:", {
        chainId,
        address,
        signerAddress: typeof (signer as any).address === "string" ? (signer as any).address : "pending",
        hasProvider: !!provider,
        isConnected
      });
    } else {
      console.log("⏳ FHEVM Sync - Waiting:", {
        chainId,
        address,
        hasSigner: !!signer,
        hasProvider: !!provider,
        isConnected
      });
    }
  }, [chainId, address, signer, provider, isConnected]);

  useSyncWithWallet({
    chainId,
    address,
    signer,
    provider,
    eip1193Provider: eip1193,
  });

  return null;
}
