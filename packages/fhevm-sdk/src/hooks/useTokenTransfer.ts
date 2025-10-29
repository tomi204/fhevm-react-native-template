"use client";

import { useCallback } from "react";
import type { Abi } from "abitype";
import { ethers } from "ethers";
import { useWriteContract } from "./useWriteContract.js";

export type UseTokenTransferParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  isConfidential?: boolean;
};

export type TransferArgs = {
  to: `0x${string}`;
  amount: string | bigint | number;
  decimals?: number; // Optional: will convert amount to raw units
};

export type UseTokenTransferReturnType = {
  transfer: (args: TransferArgs) => Promise<ethers.TransactionReceipt | undefined>;
  transferAsync: (args: TransferArgs) => Promise<ethers.TransactionReceipt | undefined>;
  data: ethers.TransactionReceipt | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

/**
 * Hook to transfer tokens (standard or confidential)
 * Automatically handles encryption for confidential tokens
 */
export function useTokenTransfer<TAbi extends Abi = Abi>(
  parameters: UseTokenTransferParameters<TAbi>,
): UseTokenTransferReturnType {
  const { address, abi, name, isConfidential = false } = parameters;

  const {
    write: writeContract,
    writeAsync: writeContractAsync,
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  } = useWriteContract({ address, abi, name });

  const transfer = useCallback(
    async (args: TransferArgs) => {
      const { to, amount, decimals } = args;

      // Convert amount to raw units if decimals provided
      let rawAmount: bigint;
      if (decimals !== undefined) {
        if (typeof amount === "bigint") {
          rawAmount = amount;
        } else {
          // Convert string/number to raw units using decimals
          rawAmount = ethers.parseUnits(String(amount), decimals);
        }
      } else {
        // Use amount as-is
        if (typeof amount === "bigint") {
          rawAmount = amount;
        } else if (typeof amount === "string") {
          rawAmount = BigInt(amount);
        } else {
          rawAmount = BigInt(Math.floor(amount));
        }
      }

      console.log("💸 useTokenTransfer: Transferring", {
        to,
        amount,
        rawAmount: rawAmount.toString(),
        decimals,
        isConfidential,
      });

      // Call appropriate function based on token type
      return await writeContract({
        functionName: isConfidential ? "confidentialTransfer" : "transfer",
        args: [to, rawAmount], // Pass bigint directly for encryption
      });
    },
    [writeContract, isConfidential]
  );

  const transferAsync = useCallback(
    async (args: TransferArgs) => {
      const { to, amount, decimals } = args;

      // Convert amount to raw units if decimals provided
      let rawAmount: bigint;
      if (decimals !== undefined) {
        if (typeof amount === "bigint") {
          rawAmount = amount;
        } else {
          rawAmount = ethers.parseUnits(String(amount), decimals);
        }
      } else {
        if (typeof amount === "bigint") {
          rawAmount = amount;
        } else if (typeof amount === "string") {
          rawAmount = BigInt(amount);
        } else {
          rawAmount = BigInt(Math.floor(amount));
        }
      }

      console.log("💸 useTokenTransfer: Transferring (async)", {
        to,
        amount,
        rawAmount: rawAmount.toString(),
        decimals,
        isConfidential,
      });

      return await writeContractAsync({
        functionName: isConfidential ? "confidentialTransfer" : "transfer",
        args: [to, rawAmount], // Pass bigint directly for encryption
      });
    },
    [writeContractAsync, isConfidential]
  );

  return {
    transfer,
    transferAsync,
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  };
}
