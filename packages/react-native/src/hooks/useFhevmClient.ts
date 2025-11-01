import { useEffect, useState } from "react";
import { createFheClient, type FheClient } from "fhevm-sdk";
import { useWallet } from "./useWallet";
import type { Signer } from "ethers";

interface UseFhevmClientOptions {
  contractAddress: `0x${string}`;
  contractAbi: any[];
  contractName: string;
  relayerBaseUrl?: string;
}

/**
 * Hook to create and manage an FHE client connected to a contract via the relayer
 */
export function useFhevmClient({
  contractAddress,
  contractAbi,
  contractName,
  relayerBaseUrl,
}: UseFhevmClientOptions) {
  const { signer, isConnected } = useWallet();
  const [client, setClient] = useState<FheClient | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !signer) {
      setClient(undefined);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(undefined);
    setClient(undefined);

    createFheClient({
      contract: {
        address: contractAddress,
        abi: contractAbi,
        name: contractName,
      },
      mode: "remote",
      relayer: {
        baseUrl: relayerBaseUrl,
      },
      signer: signer as Signer,
    })
      .then(created => {
        if (!cancelled) {
          setClient(created);
          setError(undefined);
        }
      })
      .catch(err => {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          console.error("Error creating FHE client:", errorMessage);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contractAddress, contractAbi, contractName, relayerBaseUrl, signer, isConnected]);

  return {
    client,
    error,
    isLoading,
    isReady: !!client && !error && !isLoading,
  };
}
