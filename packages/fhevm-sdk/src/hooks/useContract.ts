"use client";

import { useMemo } from "react";
import { ethers } from "ethers";
import type { Abi } from "abitype";
import { useFhevmContext } from "../config/FhevmProvider.js";
import type { ContractConfig } from "../config/types.js";

export type UseContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  mode?: "read" | "write";
};

export type UseContractReturnType<TAbi extends Abi = Abi> = {
  contract: ethers.Contract | undefined;
  address: `0x${string}` | undefined;
  abi: TAbi | undefined;
  isReady: boolean;
};

export function useContract<TAbi extends Abi = Abi>(
  parameters: UseContractParameters<TAbi> = {},
): UseContractReturnType<TAbi> {
  const { config, state } = useFhevmContext();
  const { address, abi, name, mode = "read" } = parameters;

  const contractConfig = useMemo(() => {
    if (address && abi) {
      console.log("📝 useContract: Using direct address/abi", { address, hasAbi: !!abi });
      return { address, abi } as ContractConfig<TAbi>;
    }
    if (name) {
      // First, try to find contract in current chain's contracts
      const currentChain = config.chains.find(chain => chain.id === state.chainId);
      if (currentChain?.contracts?.[name]) {
        console.log("📝 useContract: Using per-chain contract", {
          name,
          chainId: state.chainId,
          address: currentChain.contracts[name].address,
          hasAbi: !!currentChain.contracts[name].abi,
        });
        return currentChain.contracts[name] as ContractConfig<TAbi>;
      }

      // Fall back to top-level contracts
      if (config.contracts?.[name]) {
        console.log("📝 useContract: Using top-level contract", {
          name,
          address: config.contracts[name].address,
          hasAbi: !!config.contracts[name].abi,
        });
        return config.contracts[name] as ContractConfig<TAbi>;
      }
    }
    console.log("⚠️ useContract: No contract config found", {
      address,
      name,
      chainId: state.chainId,
      hasConfigContracts: !!config.contracts,
      availableChains: config.chains.map(c => c.id)
    });
    return undefined;
  }, [address, abi, name, config.contracts, config.chains, state.chainId]);

  const providerOrSigner = useMemo(() => {
    if (mode === "write") {
      return state.signer;
    }
    return state.provider || state.signer;
  }, [mode, state.signer, state.provider]);

  const contract = useMemo(() => {
    if (!contractConfig || !providerOrSigner) {
      console.log("⚠️ useContract: Cannot create contract", {
        hasContractConfig: !!contractConfig,
        hasProviderOrSigner: !!providerOrSigner,
        mode
      });
      return undefined;
    }
    console.log("✅ useContract: Creating ethers.Contract", {
      address: contractConfig.address,
      hasAbi: !!contractConfig.abi,
      abiLength: Array.isArray(contractConfig.abi) ? contractConfig.abi.length : 'not array',
      hasProviderOrSigner: !!providerOrSigner,
      mode
    });
    const newContract = new ethers.Contract(contractConfig.address, contractConfig.abi as any, providerOrSigner);
    console.log("✅ useContract: Contract created", {
      address: newContract.target,
      hasInterface: !!newContract.interface,
      functionCount: newContract.interface?.fragments?.length || 0
    });
    return newContract;
  }, [contractConfig, providerOrSigner, mode]);

  const isReady = useMemo(() => {
    return Boolean(contract && (mode === "read" ? true : state.signer));
  }, [contract, mode, state.signer]);

  return {
    contract,
    address: contractConfig?.address,
    abi: contractConfig?.abi,
    isReady,
  };
}
