"use client";

import { useState, useCallback } from "react";
import type { Abi } from "abitype";
import { ethers } from "ethers";
import { useContract } from "./useContract.js";
import { useFhevmContext } from "../config/FhevmProvider.js";
import { getEncryptionMethod, buildParamsFromAbi } from "../react/useFHEEncryption.js";

export type UseWriteContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
};

export type WriteContractArgs = {
  functionName: string;
  args?: any[];
  value?: bigint;
  gasLimit?: bigint;
};

export type UseWriteContractReturnType = {
  write: (args: WriteContractArgs) => Promise<ethers.TransactionReceipt | undefined>;
  writeAsync: (args: WriteContractArgs) => Promise<ethers.TransactionReceipt | undefined>;
  data: ethers.TransactionReceipt | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useWriteContract<TAbi extends Abi = Abi>(
  parameters: UseWriteContractParameters<TAbi> = {},
): UseWriteContractReturnType {
  const { address, abi: contractAbi, name } = parameters;
  const { contract, isReady, abi, address: resolvedAddress } = useContract({ address, abi: contractAbi, name, mode: "write" });
  const { instance, state } = useFhevmContext();

  const [data, setData] = useState<ethers.TransactionReceipt | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setData(undefined);
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  const encryptArgs = useCallback(
    async (functionName: string, args: any[]) => {
      console.log("🔐 useWriteContract: Checking encryption requirements", {
        hasInstance: !!instance,
        hasSigner: !!state.signer,
        resolvedAddress,
        hasAbi: !!abi,
        functionName,
        args,
      });

      if (!instance || !state.signer || !resolvedAddress || !abi) {
        const missing = [];
        if (!instance) missing.push("instance");
        if (!state.signer) missing.push("signer");
        if (!resolvedAddress) missing.push("resolvedAddress");
        if (!abi) missing.push("abi");

        throw new Error(`Missing required parameters for encryption: ${missing.join(", ")}`);
      }

      const fnAbi = (abi as unknown as any[]).find(item => item.type === "function" && item.name === functionName);
      if (!fnAbi || !fnAbi.inputs) {
        throw new Error(`Function ${functionName} not found in ABI`);
      }

      // Check if any inputs need encryption
      const needsEncryption = fnAbi.inputs.some((input: any) =>
        input.internalType?.startsWith("externalE") || input.internalType?.startsWith("euint"),
      );

      if (!needsEncryption) {
        return args; // Return args as-is if no encryption needed
      }

      console.log("🔐 useWriteContract: Encrypting args", {
        functionName,
        inputs: fnAbi.inputs,
        args,
      });

      const userAddress = await state.signer.getAddress();
      const input = instance.createEncryptedInput(resolvedAddress, userAddress);

      // Build encrypted inputs
      fnAbi.inputs.forEach((inputParam: any, index: number) => {
        const internalType = inputParam.internalType || "";

        // Handle externalE types (e.g., externalEuint64)
        if (internalType.startsWith("externalE")) {
          const method = getEncryptionMethod(internalType);
          (input as any)[method](args[index] ?? 0);
        }
        // Handle euint types directly (e.g., euint64)
        else if (internalType.startsWith("euint")) {
          // Extract the bit size (e.g., "euint64" -> "64")
          const bitSize = internalType.replace("euint", "");
          const method = `add${bitSize}`;

          console.log(`🔐 Encrypting ${inputParam.name} with ${method}`, {
            value: args[index],
            internalType,
          });

          (input as any)[method](args[index] ?? 0);
        }
      });

      const encrypted = await input.encrypt();

      console.log("✅ useWriteContract: Encrypted", {
        handles: encrypted.handles,
        inputProofLength: encrypted.inputProof?.length,
      });

      const finalArgs = buildParamsFromAbi(encrypted, abi as unknown as any[], functionName, args);

      console.log("✅ useWriteContract: Final args", {
        original: args,
        final: finalArgs,
      });

      return finalArgs;
    },
    [instance, state.signer, resolvedAddress, abi],
  );

  const writeAsync = useCallback(
    async (writeArgs: WriteContractArgs): Promise<ethers.TransactionReceipt | undefined> => {
      if (!contract || !isReady) {
        throw new Error("Contract not ready");
      }

      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const { functionName, args = [], value, gasLimit } = writeArgs;

        // Auto-encrypt args if needed
        const processedArgs = await encryptArgs(functionName, args);

        const overrides: any = {};
        if (value) overrides.value = value;
        if (gasLimit) overrides.gasLimit = gasLimit;

        const tx = await contract[functionName](...processedArgs, overrides);
        const receipt = await tx.wait();

        setData(receipt);
        setIsSuccess(true);
        return receipt;
      } catch (err) {
        setIsError(true);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, isReady, encryptArgs],
  );

  const write = useCallback(
    (args: WriteContractArgs) => {
      return writeAsync(args).catch(err => {
        console.error("Write contract error:", err);
        return undefined;
      });
    },
    [writeAsync],
  );

  return {
    write,
    writeAsync,
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  };
}
