"use client";

import { useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useBatchTransactions,
  useOperator,
  useContract,
  getUserFriendlyError,
} from "fhevm-sdk";
import { useAccount } from "wagmi";

export const AdvancedDemo = () => {
  const { address, isConnected } = useAccount();
  const [recipient1, setRecipient1] = useState("");
  const [recipient2, setRecipient2] = useState("");
  const [amount1, setAmount1] = useState(10);
  const [amount2, setAmount2] = useState(20);

  // Read encrypted balance
  const { decryptedData: balance, refetch } = useReadContract({
    name: "FHECounter",
    functionName: "getCount",
    enabled: isConnected,
  });

  // Write operations
  const { write, isLoading } = useWriteContract({
    name: "FHECounter",
  });

  // Batch transactions
  const { contract } = useContract({ name: "FHECounter" });
  const {
    addToBatch,
    executeBatch,
    clearBatch,
    batch,
    isExecuting,
    progress,
    results,
  } = useBatchTransactions();

  // Operator management
  const { isOperator, setupOperator, isSettingUp } = useOperator({
    name: "FHECounter",
    operatorAddress: address as `0x${string}`,
  });

  const handleSingleOperation = async () => {
    try {
      await write({
        functionName: "increment",
        args: [5],
      });
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      const message = getUserFriendlyError(error);
      alert(message);
    }
  };

  const handleAddToBatch = () => {
    if (contract) {
      addToBatch({
        id: "op1",
        contract,
        functionName: "increment",
        args: [amount1],
      });
      addToBatch({
        id: "op2",
        contract,
        functionName: "increment",
        args: [amount2],
      });
    }
  };

  const handleExecuteBatch = async () => {
    try {
      const batchResults = await executeBatch();
      console.log("Batch results:", batchResults);
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error("Batch execution failed:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Connect your wallet to see advanced features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Advanced SDK Demo</h2>
        <p className="text-gray-600 mb-6">
          Batch transactions, operator management, and more
        </p>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
          <p className="text-4xl font-bold text-blue-600">
            {balance?.toString() || "0"}
          </p>
        </div>

        {/* Operator Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Operator Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-lg font-semibold ${isOperator ? "text-green-600" : "text-red-600"}`}>
                {isOperator ? "✅ Operator Set" : "❌ Not an Operator"}
              </p>
            </div>
            {!isOperator && (
              <button
                onClick={setupOperator}
                disabled={isSettingUp}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSettingUp ? "Setting up..." : "Setup Operator"}
              </button>
            )}
          </div>
        </div>

        {/* Single Operation */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Single Operation</h3>
          <button
            onClick={handleSingleOperation}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            {isLoading ? "Processing..." : "Increment by 5"}
          </button>
        </div>

        {/* Batch Operations */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold mb-4">Batch Operations</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation 1 Amount
              </label>
              <input
                type="number"
                value={amount1}
                onChange={e => setAmount1(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation 2 Amount
              </label>
              <input
                type="number"
                value={amount2}
                onChange={e => setAmount2(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={handleAddToBatch}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Add to Batch ({batch.length})
            </button>
            <button
              onClick={clearBatch}
              disabled={batch.length === 0}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-semibold"
            >
              Clear
            </button>
          </div>

          {batch.length > 0 && (
            <>
              <button
                onClick={handleExecuteBatch}
                disabled={isExecuting}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold mb-4"
              >
                {isExecuting ? `Executing... ${progress.toFixed(0)}%` : `Execute ${batch.length} Operations`}
              </button>

              {isExecuting && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </>
          )}

          {results.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Batch Results</h4>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={result.id || index}
                    className={`p-3 rounded ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                  >
                    <p className="text-sm font-medium">
                      Operation {index + 1}: {result.success ? "✅ Success" : "❌ Failed"}
                    </p>
                    {result.error && (
                      <p className="text-xs mt-1">{result.error.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SDK Features List */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What This Demo Shows
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Features Used:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ useReadContract with auto-decrypt</li>
              <li>✓ useWriteContract with auto-encrypt</li>
              <li>✓ useBatchTransactions</li>
              <li>✓ useOperator management</li>
              <li>✓ Error handling with getUserFriendlyError</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Developer Benefits:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>🚀 No manual encryption code</li>
              <li>💾 Automatic caching</li>
              <li>🔄 Progress tracking</li>
              <li>🎯 Type-safe operations</li>
              <li>🛡️ Error handling built-in</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
