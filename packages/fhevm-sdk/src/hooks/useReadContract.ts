"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import type { Abi } from "abitype";
import { useContract } from "./useContract.js";
import { useDecryptedValue } from "./useDecryptedValue.js";

export type UseReadContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  functionName: string;
  args?: any[];
  enabled?: boolean;
  watch?: boolean;
  decrypt?: boolean; // Auto-decrypt if return value is encrypted
};

export type UseReadContractReturnType = {
  data: any;
  encryptedData: string | undefined;
  decryptedData: string | bigint | boolean | undefined;
  isLoading: boolean;
  isDecrypting: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useReadContract<TAbi extends Abi = Abi>(
  parameters: UseReadContractParameters<TAbi>,
): UseReadContractReturnType {
  const { address, abi, name, functionName, args = [], enabled = true, watch = false, decrypt = true } = parameters;

  const { contract, isReady, address: resolvedAddress } = useContract({ address, abi, name, mode: "read" });

  // Stabilize args reference to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableArgs = useMemo(() => args, [JSON.stringify(args)]);

  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isEncryptedHandle = useMemo(() => {
    if (!data || typeof data !== "string") {
      console.log("⚠️ useReadContract: Data is not a valid string", { data, typeofData: typeof data });
      return false;
    }
    // Check if it looks like a bytes32 handle (0x followed by 64 hex chars)
    const isHandle = data.startsWith("0x") && data.length === 66;
    const isZero = data === "0x0000000000000000000000000000000000000000000000000000000000000000";
    console.log("🔍 useReadContract: Checking if encrypted handle", {
      data,
      isHandle,
      length: data.length,
      isZeroHash: isZero
    });
    return isHandle && !isZero; // Don't try to decrypt zero hash
  }, [data]);

  const {
    decryptedValue,
    isDecrypting
  } = useDecryptedValue({
    handle: isEncryptedHandle && decrypt ? data : undefined,
    contractAddress: resolvedAddress,
  });

  // Debug logging for decrypt
  useEffect(() => {
    if (isEncryptedHandle && decrypt) {
      console.log("🔐 useReadContract: Decrypt setup", {
        handle: data,
        contractAddress: resolvedAddress,
        hasResolvedAddress: !!resolvedAddress,
        isDecrypting,
        decryptedValue
      });
    }
  }, [isEncryptedHandle, decrypt, data, resolvedAddress, isDecrypting, decryptedValue]);

  const fetchData = useCallback(async () => {
    if (!contract || !isReady || !enabled) {
      console.log("⏸️ useReadContract: Skipping fetch", {
        hasContract: !!contract,
        isReady,
        enabled,
        functionName
      });
      return;
    }

    console.log("🔍 useReadContract: Starting fetch", {
      functionName,
      args: stableArgs,
      hasContract: !!contract,
      contractAddress: contract.target,
      functionExists: typeof contract[functionName] === 'function',
      availableFunctions: Object.keys(contract).filter(k => typeof (contract as any)[k] === 'function').slice(0, 10)
    });

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      if (typeof contract[functionName] !== 'function') {
        throw new Error(`contract[${functionName}] is not a function`);
      }
      const result = await contract[functionName](...stableArgs);
      console.log("✅ useReadContract: Success", { functionName, result });
      setData(result);
    } catch (err) {
      console.error("❌ useReadContract: Error", { functionName, error: err });
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [contract, isReady, enabled, functionName, stableArgs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Watch for changes if enabled
  useEffect(() => {
    if (!watch || !contract || !enabled) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [watch, contract, enabled, fetchData]);

  const returnValue = useMemo(() => {
    const result = {
      data,
      encryptedData: isEncryptedHandle ? data : undefined,
      decryptedData: isEncryptedHandle && decrypt ? decryptedValue : data,
      isLoading,
      isDecrypting,
      isError,
      error,
      refetch: fetchData,
    };

    console.log("📤 useReadContract: Returning", {
      isEncryptedHandle,
      decrypt,
      decryptedValue,
      decryptedData: result.decryptedData
    });

    return result;
  }, [data, isEncryptedHandle, decrypt, decryptedValue, isLoading, isDecrypting, isError, error, fetchData]);

  return returnValue;
}
