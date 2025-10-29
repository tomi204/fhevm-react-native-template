"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";

export type BatchTransaction = {
  id?: string;
  contract: ethers.Contract;
  functionName: string;
  args: any[];
  value?: bigint;
  gasLimit?: bigint;
};

export type BatchTransactionResult = {
  id?: string;
  success: boolean;
  receipt?: ethers.TransactionReceipt;
  error?: Error;
};

export type UseBatchTransactionsReturnType = {
  batch: BatchTransaction[];
  results: BatchTransactionResult[];
  addToBatch: (tx: BatchTransaction) => void;
  removeFromBatch: (id: string) => void;
  clearBatch: () => void;
  executeBatch: () => Promise<BatchTransactionResult[]>;
  isExecuting: boolean;
  progress: number; // 0-100
};

export function useBatchTransactions(): UseBatchTransactionsReturnType {
  const [batch, setBatch] = useState<BatchTransaction[]>([]);
  const [results, setResults] = useState<BatchTransactionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);

  const addToBatch = useCallback((tx: BatchTransaction) => {
    const txWithId = { ...tx, id: tx.id || `tx-${Date.now()}-${Math.random()}` };
    setBatch(prev => [...prev, txWithId]);
  }, []);

  const removeFromBatch = useCallback((id: string) => {
    setBatch(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const clearBatch = useCallback(() => {
    setBatch([]);
    setResults([]);
    setProgress(0);
  }, []);

  const executeBatch = useCallback(async (): Promise<BatchTransactionResult[]> => {
    if (batch.length === 0) {
      return [];
    }

    setIsExecuting(true);
    setProgress(0);
    const batchResults: BatchTransactionResult[] = [];

    try {
      for (let i = 0; i < batch.length; i++) {
        const tx = batch[i]!;
        const result: BatchTransactionResult = { id: tx.id, success: false };

        try {
          const overrides: any = {};
          if (tx.value) overrides.value = tx.value;
          if (tx.gasLimit) overrides.gasLimit = tx.gasLimit;

          const txResponse = await tx.contract[tx.functionName](...tx.args, overrides);
          const receipt = await txResponse.wait();

          result.success = true;
          result.receipt = receipt;
        } catch (err) {
          result.error = err instanceof Error ? err : new Error(String(err));
        }

        batchResults.push(result);
        setProgress(((i + 1) / batch.length) * 100);
      }

      setResults(batchResults);
      return batchResults;
    } finally {
      setIsExecuting(false);
    }
  }, [batch]);

  return {
    batch,
    results,
    addToBatch,
    removeFromBatch,
    clearBatch,
    executeBatch,
    isExecuting,
    progress,
  };
}
