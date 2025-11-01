import { useEffect, useState } from "react";
import { useAccount, useProvider } from "@reown/appkit-react-native";
import { ethers, BrowserProvider } from "ethers";

/**
 * Hook to get wallet information and signer from Reown AppKit
 */
export function useWallet() {
  const { address, isConnected, caipAddress } = useAccount();
  const { walletProvider } = useProvider("eip155");
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Extract chainId from CAIP address (format: eip155:chainId:address)
    if (caipAddress) {
      const parts = caipAddress.split(":");
      if (parts.length >= 2) {
        setChainId(parseInt(parts[1], 10));
      }
    } else {
      setChainId(undefined);
    }
  }, [caipAddress]);

  useEffect(() => {
    if (!walletProvider || !isConnected) {
      setSigner(undefined);
      return;
    }

    const getSigner = async () => {
      try {
        const provider = new BrowserProvider(walletProvider);
        const ethersigner = await provider.getSigner();
        setSigner(ethersigner);
      } catch (error) {
        console.error("Error getting signer:", error);
        setSigner(undefined);
      }
    };

    getSigner();
  }, [walletProvider, isConnected, address]);

  return {
    address: address as `0x${string}` | undefined,
    isConnected,
    chainId,
    signer,
  };
}
