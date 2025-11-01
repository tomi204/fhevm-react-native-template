"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  getUserFriendlyError,
  useFhevmContext,
} from "fhevm-sdk";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import toast from "react-hot-toast";

function FHECounterWagmiDemoInner() {
  const { isConnected, address, chainId } = useAccount();
  const { open } = useAppKit();
  const { instance, state } = useFhevmContext();
  const [amount, setAmount] = useState(1);

  // Check if we're on a supported network (Localhost or Sepolia)
  const isSupportedNetwork = chainId === 31337 || chainId === 11155111;

  // Log FHEVM context state for debugging
  useEffect(() => {
    console.log("🔐 FHEVM Context State:", {
      hasInstance: !!instance,
      hasSigner: !!state.signer,
      hasAddress: !!state.account,
      chainId: state.chainId,
      isInitialized: !!instance && !!state.signer,
    });
  }, [instance, state]);

  // Read the encrypted counter value
  const {
    encryptedData: handle,
    decryptedData: value,
    isLoading: isReading,
    isDecrypting,
    refetch,
    error: readError,
  } = useReadContract({
    name: "FHECounter",
    functionName: "getCount",
    enabled: isConnected && isSupportedNetwork,
    watch: false, // We'll manually refetch after writes
  });

  // Write operations (increment/decrement)
  const {
    write,
    isLoading: isWriting,
    isSuccess,
    error: writeError,
    reset,
  } = useWriteContract({
    name: "FHECounter",
  });

  // Show success toast
  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction successful! 🎉");
      // Refetch after transaction
      setTimeout(() => {
        refetch();
        reset();
      }, 2000);
    }
  }, [isSuccess, refetch, reset]);

  // Show error toast
  useEffect(() => {
    if (writeError) {
      const message = getUserFriendlyError(writeError);
      toast.error(message);
    }
  }, [writeError]);

  const handleIncrement = async () => {
    try {
      console.log("🚀 Attempting increment with:", {
        amount,
        hasInstance: !!instance,
        hasSigner: !!state.signer,
        address: state.account,
        chainId: state.chainId,
      });

      await write({
        functionName: "increment",
        args: [amount], // SDK automatically encrypts this!
      });
    } catch (error) {
      console.error("❌ Increment failed:", error);
    }
  };

  const handleDecrement = async () => {
    try {
      await write({
        functionName: "decrement",
        args: [amount], // SDK automatically encrypts this!
      });
    } catch (error) {
      console.error("Decrement failed:", error);
    }
  };

  const buttonClass =
    "px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-900">
        <div className="flex items-center justify-center">
          <div className="bg-white border shadow-xl p-8 text-center rounded-lg">
            <div className="mb-4">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 text-3xl">
                ⚠️
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-700 mb-6">Connect your wallet to use the FHE Counter demo.</p>
            <div className="flex items-center justify-center">
              <button
                onClick={() => open()}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 bg-blue-600 text-white hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupportedNetwork) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-900">
        <div className="flex items-center justify-center">
          <div className="bg-white border shadow-xl p-8 text-center rounded-lg">
            <div className="mb-4">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-red-600 text-3xl">
                🔴
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Wrong Network</h2>
            <p className="text-gray-700 mb-6">
              FHE Counter is available on Localhost (chainId 31337) and Sepolia (chainId 11155111). Please switch to a supported network.
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={() => open({ view: "Networks" })}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 bg-blue-600 text-white hover:bg-blue-700"
              >
                Switch Network
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-900">
      <div className="text-center mb-8 text-black">
        <h1 className="text-4xl font-bold mb-2">🔐 FHE Counter Demo</h1>
        <p className="text-gray-600 text-lg">Wagmi-like API for Encrypted Smart Contracts</p>
        <p className="text-sm text-gray-500 mt-2">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
      </div>

      {/* Main Counter Card */}
      <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Counter Value</h2>

        {/* Counter Display */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 mb-6 border border-blue-200">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Encrypted Handle</p>
              <div className="bg-white p-4 rounded border border-gray-300 shadow-sm">
                <p className="font-mono text-xs break-all text-gray-800">
                  {handle || (isReading ? "Loading..." : "Not available")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Decrypted Value</p>
              {isDecrypting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-lg text-gray-600">Decrypting...</span>
                </div>
              ) : (
                <p className="text-6xl font-bold text-blue-600">
                  {value?.toString() || "0"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Amount to Increment/Decrement
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            min="1"
            max="1000"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-gray-900"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={handleIncrement}
            disabled={isWriting || isReading || isDecrypting}
            className={`${buttonClass} bg-green-600 text-white hover:bg-green-700 text-lg`}
          >
            {isWriting ? "⏳ Processing..." : `➕ Increment by ${amount}`}
          </button>
          <button
            onClick={handleDecrement}
            disabled={isWriting || isReading || isDecrypting}
            className={`${buttonClass} bg-red-600 text-white hover:bg-red-700 text-lg`}
          >
            {isWriting ? "⏳ Processing..." : `➖ Decrement by ${amount}`}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isReading || isDecrypting}
            className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700 text-lg`}
          >
            {isReading ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Status Messages */}
        {readError && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">❌ Error: {readError.message}</p>
          </div>
        )}
      </div>

      {/* Features Showcase */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">✨ Active Features</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2 text-lg">✓</span>
              <span><strong>Auto-encryption:</strong> Just pass numbers, SDK encrypts them</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2 text-lg">✓</span>
              <span><strong>Auto-decryption:</strong> Values decrypted automatically</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2 text-lg">✓</span>
              <span><strong>Native caching:</strong> Decrypt once, use everywhere</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2 text-lg">✓</span>
              <span><strong>Error handling:</strong> User-friendly error messages</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 SDK Hooks Used</h3>
          <ul className="space-y-3 text-sm text-gray-700 font-mono">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span><strong>useReadContract</strong> - Read encrypted values</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span><strong>useWriteContract</strong> - Write with auto-encrypt</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span><strong>getUserFriendlyError</strong> - Error handling</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">→</span>
              <span><strong>FhevmProvider</strong> - Context management</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">📝 How Simple Is It?</h3>
        <pre className="text-sm text-green-400 overflow-x-auto">
          <code>{`// Read encrypted value (auto-decrypts!)
const { decryptedData } = useReadContract({
  name: "FHECounter",
  functionName: "getCount",
});

// Write encrypted value (auto-encrypts!)
const { write } = useWriteContract({ name: "FHECounter" });
await write({ functionName: "increment", args: [5] });

// That's it! No manual encryption/decryption needed 🎉`}</code>
        </pre>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-3xl font-bold text-blue-600">90%</p>
          <p className="text-sm text-gray-600">Less code needed</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-3xl font-bold text-green-600">100%</p>
          <p className="text-sm text-gray-600">Type safe</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-3xl font-bold text-purple-600">0</p>
          <p className="text-sm text-gray-600">Manual encryption</p>
        </div>
      </div>
    </div>
  );
}

export const FHECounterWagmiDemo = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted on client to avoid SSR issues with WagmiProvider
  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-900">
        <div className="flex items-center justify-center">
          <div className="bg-white border shadow-xl p-8 text-center rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return <FHECounterWagmiDemoInner />;
};
