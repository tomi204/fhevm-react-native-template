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
    if (name && config.contracts?.[name]) {
      console.log("📝 useContract: Using contract by name", {
        name,
        address: config.contracts[name].address,
        hasAbi: !!config.contracts[name].abi,
        abiLength: Array.isArray(config.contracts[name].abi) ? config.contracts[name].abi.length : 'not array'
      });
      return config.contracts[name] as ContractConfig<TAbi>;
    }
    console.log("⚠️ useContract: No contract config found", { address, name, hasConfigContracts: !!config.contracts });
    return undefined;
  }, [address, abi, name, config.contracts]);

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
