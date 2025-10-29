"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useFhevmContext } from "../config/FhevmProvider.js";
import { FhevmDecryptionSignature } from "../FhevmDecryptionSignature.js";
import { GenericStringInMemoryStorage } from "../storage/GenericStringStorage.js";

export type UseDecryptedValueParameters = {
  handle: string | undefined;
  contractAddress: `0x${string}` | undefined;
  enabled?: boolean;
};

export type UseDecryptedValueReturnType = {
  decryptedValue: string | bigint | boolean | undefined;
  isDecrypting: boolean;
  isError: boolean;
  error: Error | null;
  decrypt: () => void;
};

const decryptStorage = new GenericStringInMemoryStorage();

export function useDecryptedValue(parameters: UseDecryptedValueParameters): UseDecryptedValueReturnType {
  const { handle, contractAddress, enabled = true } = parameters;
  const { instance, state, decryptCache, config } = useFhevmContext();

  const [decryptedValue, setDecryptedValue] = useState<string | bigint | boolean | undefined>(undefined);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isDecryptingRef = useRef(false);

  // Create cache key
  const cacheKey = useMemo(() => {
    if (!handle || !contractAddress || !state.account || !state.chainId) return undefined;
    return `${state.chainId}:${state.account}:${contractAddress}:${handle}`;
  }, [handle, contractAddress, state.account, state.chainId]);

  // Check cache
  const cachedValue = useMemo(() => {
    if (!cacheKey || !config.cache?.enabled) return undefined;
    const cached = decryptCache.get(cacheKey);
    if (!cached) return undefined;

    const now = Date.now();
    const ttl = config.cache?.ttl ?? 60000;
    if (now - cached.timestamp > ttl) {
      decryptCache.delete(cacheKey);
      return undefined;
    }

    return cached.value;
  }, [cacheKey, decryptCache, config.cache]);

  const decrypt = useCallback(async () => {
    if (!handle || !contractAddress || !instance || !state.signer || !state.account || !state.chainId) {
      return;
    }

    if (handle === ethers.ZeroHash) {
      // Store zero value in cache and state
      if (cacheKey && config.cache?.enabled) {
        decryptCache.set(cacheKey, {
          value: "0",
          timestamp: Date.now(),
          chainId: state.chainId,
          account: state.account,
        });
      }
      setDecryptedValue("0");
      return;
    }

    if (isDecryptingRef.current) return;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setIsError(false);
    setError(null);

    try {
      console.log("🔐 useDecryptedValue: Starting decrypt", {
        handle,
        contractAddress,
        hasInstance: !!instance,
        hasSigner: !!state.signer,
      });

      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress],
        state.signer as ethers.Signer,
        decryptStorage,
      );

      if (!sig) {
        throw new Error("Unable to create FHE signature");
      }

      console.log("✅ useDecryptedValue: Signature obtained", {
        hasPublicKey: !!sig.publicKey,
        hasPrivateKey: !!sig.privateKey,
        hasSignature: !!sig.signature,
      });

      const results = await instance.userDecrypt(
        [{ handle, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays,
      );

      console.log("✅ useDecryptedValue: Decrypt results", { results });

      const clear = results[handle];
      if (typeof clear === "undefined") {
        throw new Error("Empty decrypt result");
      }

      console.log("✅ useDecryptedValue: Decrypted value", { clear });

      // Store in cache AND update state
      if (cacheKey && config.cache?.enabled) {
        decryptCache.set(cacheKey, {
          value: clear,
          timestamp: Date.now(),
          chainId: state.chainId,
          account: state.account,
        });
      }

      // Update state with decrypted value
      setDecryptedValue(clear);
    } catch (err) {
      console.error("❌ useDecryptedValue: Decrypt error", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isDecryptingRef.current = false;
      setIsDecrypting(false);
    }
  }, [handle, contractAddress, instance, state.signer, state.account, state.chainId, cacheKey, config.cache, decryptCache]);

  // Load from cache when cacheKey changes
  useEffect(() => {
    if (cachedValue !== undefined) {
      setDecryptedValue(cachedValue);
    }
  }, [cachedValue]);

  // Auto-decrypt if enabled and not in cache
  useEffect(() => {
    if (!enabled || cachedValue !== undefined || !handle || !contractAddress) return;
    decrypt();
  }, [enabled, cachedValue, handle, contractAddress, decrypt]);

  return {
    decryptedValue,
    isDecrypting,
    isError,
    error,
    decrypt,
  };
}
