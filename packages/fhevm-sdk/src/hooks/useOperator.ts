"use client";

import { useState, useEffect, useCallback } from "react";
import type { Abi } from "abitype";
import { ethers } from "ethers";
import { useContract } from "./useContract.js";
import { useFhevmContext } from "../config/FhevmProvider.js";

export type UseOperatorParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  operatorAddress?: `0x${string}`;
  expiryDays?: number; // Default: 30 days
  autoSetup?: boolean; // Auto-setup operator if not set
};

export type UseOperatorReturnType = {
  isOperator: boolean | undefined;
  isChecking: boolean;
  isSettingUp: boolean;
  error: Error | null;
  checkOperator: () => Promise<boolean>;
  setupOperator: () => Promise<void>;
  ensureOperator: () => Promise<boolean>;
};

const SECONDS_PER_DAY = 86400;

export function useOperator<TAbi extends Abi = Abi>(
  parameters: UseOperatorParameters<TAbi> = {},
): UseOperatorReturnType {
  const { address, abi, name, operatorAddress, expiryDays = 30, autoSetup = false } = parameters;
  const { contract } = useContract({ address, abi, name, mode: "write" });
  const { state } = useFhevmContext();

  const [isOperator, setIsOperator] = useState<boolean | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkOperator = useCallback(async (): Promise<boolean> => {
    if (!contract || !state.account || !operatorAddress) {
      return false;
    }

    setIsChecking(true);
    setError(null);

    try {
      const result = await contract.isOperator(state.account, operatorAddress);
      setIsOperator(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsOperator(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [contract, state.account, operatorAddress]);

  const setupOperator = useCallback(async (): Promise<void> => {
    if (!contract || !operatorAddress) {
      throw new Error("Contract or operator address not available");
    }

    setIsSettingUp(true);
    setError(null);

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expiryTimestamp = currentTimestamp + expiryDays * SECONDS_PER_DAY;

      const tx = await contract.setOperator(operatorAddress, expiryTimestamp);
      await tx.wait();

      setIsOperator(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsSettingUp(false);
    }
  }, [contract, operatorAddress, expiryDays]);

  const ensureOperator = useCallback(async (): Promise<boolean> => {
    const isOp = await checkOperator();
    if (!isOp) {
      await setupOperator();
      return true;
    }
    return true;
  }, [checkOperator, setupOperator]);

  // Auto-check operator status on mount and when dependencies change
  useEffect(() => {
    if (!contract || !operatorAddress || !state.account) {
      setIsOperator(undefined);
      return;
    }

    checkOperator();
  }, [contract, operatorAddress, state.account, checkOperator]);

  // Auto-setup if enabled
  useEffect(() => {
    if (!autoSetup || isOperator !== false || isSettingUp) return;

    setupOperator().catch(err => {
      console.error("Failed to auto-setup operator:", err);
    });
  }, [autoSetup, isOperator, isSettingUp, setupOperator]);

  return {
    isOperator,
    isChecking,
    isSettingUp,
    error,
    checkOperator,
    setupOperator,
    ensureOperator,
  };
}
