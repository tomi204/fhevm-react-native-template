"use client";

import { useMemo } from "react";
import type { Abi } from "abitype";
import { ethers } from "ethers";
import { useReadContract } from "./useReadContract.js";

export type UseTokenBalanceParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  account?: `0x${string}`;
  isConfidential?: boolean;
  enabled?: boolean;
  watch?: boolean;
};

export type UseTokenBalanceReturnType = {
  balance: string | undefined; // Formatted balance (e.g., "845.5137")
  balanceRaw: bigint | undefined; // Raw balance
  balanceFormatted: string | undefined; // Formatted with symbol (e.g., "845.5137 CGOV")
  decimals: number | undefined;
  symbol: string | undefined;
  encryptedBalance: string | undefined;
  isLoading: boolean;
  isDecrypting: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to read token balance with automatic formatting
 * Supports both standard ERC-20 and confidential tokens
 */
export function useTokenBalance<TAbi extends Abi = Abi>(
  parameters: UseTokenBalanceParameters<TAbi>,
): UseTokenBalanceReturnType {
  const {
    address,
    abi,
    name,
    account,
    isConfidential = false,
    enabled = true,
    watch = false
  } = parameters;

  // Read decimals
  const {
    data: decimals,
    isLoading: isLoadingDecimals,
  } = useReadContract({
    address,
    abi,
    name,
    functionName: "decimals",
    enabled: enabled && !!account,
    decrypt: false,
  });

  // Read symbol
  const {
    data: symbol,
    isLoading: isLoadingSymbol,
  } = useReadContract({
    address,
    abi,
    name,
    functionName: "symbol",
    enabled: enabled && !!account,
    decrypt: false,
  });

  // Read balance (confidential or standard)
  const {
    data: balanceRaw,
    encryptedData: encryptedBalance,
    decryptedData: decryptedBalance,
    isLoading: isLoadingBalance,
    isDecrypting,
    isError,
    error,
    refetch,
  } = useReadContract({
    address,
    abi,
    name,
    functionName: isConfidential ? "confidentialBalanceOf" : "balanceOf",
    args: [account],
    enabled: enabled && !!account,
    watch,
    decrypt: isConfidential,
  });

  // Format balance
  const { balance, balanceFormatted, balanceRawBigInt } = useMemo(() => {
    const rawValue = isConfidential ? decryptedBalance : balanceRaw;

    if (!rawValue || !decimals) {
      return {
        balance: undefined,
        balanceFormatted: undefined,
        balanceRawBigInt: undefined
      };
    }

    try {
      // Convert to bigint
      let rawBigInt: bigint;
      if (typeof rawValue === "bigint") {
        rawBigInt = rawValue;
      } else if (typeof rawValue === "string") {
        rawBigInt = rawValue.startsWith("0x") ? BigInt(rawValue) : BigInt(rawValue);
      } else if (typeof rawValue === "boolean") {
        rawBigInt = rawValue ? 1n : 0n;
      } else {
        return {
          balance: undefined,
          balanceFormatted: undefined,
          balanceRawBigInt: undefined
        };
      }

      // Format with ethers
      const formatted = ethers.formatUnits(rawBigInt, Number(decimals));

      // Trim to 4 decimal places
      const [integer, fractional = ""] = formatted.split(".");
      const trimmedFractional = fractional.slice(0, 4).replace(/0+$/, "");
      const balance = trimmedFractional.length > 0
        ? `${integer}.${trimmedFractional}`
        : integer;

      // Add symbol if available
      const balanceFormatted = symbol
        ? `${balance} ${symbol}`
        : balance;

      return { balance, balanceFormatted, balanceRawBigInt: rawBigInt };
    } catch (err) {
      console.error("Error formatting balance:", err);
      return {
        balance: undefined,
        balanceFormatted: undefined,
        balanceRawBigInt: undefined
      };
    }
  }, [isConfidential, decryptedBalance, balanceRaw, decimals, symbol]);

  const isLoading = isLoadingDecimals || isLoadingSymbol || isLoadingBalance;

  return {
    balance,
    balanceRaw: balanceRawBigInt,
    balanceFormatted,
    decimals: decimals ? Number(decimals) : undefined,
    symbol: symbol ? String(symbol) : undefined,
    encryptedBalance: isConfidential ? encryptedBalance : undefined,
    isLoading,
    isDecrypting,
    isError,
    error,
    refetch,
  };
}
