"use client";

import { useState, useEffect } from "react";
import {
  useTokenBalance,
  useTokenTransfer,
  getUserFriendlyError,
} from "fhevm-sdk";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import toast from "react-hot-toast";

function ConfidentialTokenDemoInner() {
  const { isConnected, address, chainId } = useAccount();
  const { open } = useAppKit();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // Check if we're on Sepolia
  const isSepoliaNetwork = chainId === 11155111;

  // Read the encrypted balance with auto-formatting
  const {
    balance,
    balanceFormatted,
    symbol,
    decimals,
    encryptedBalance,
    isLoading: isLoadingBalance,
    isDecrypting,
    refetch: refetchBalance,
    error: balanceError,
  } = useTokenBalance({
    name: "ConfidentialToken",
    account: address,
    isConfidential: true,
    enabled: isConnected && isSepoliaNetwork,
    watch: false,
  });

  // Debug logging
  useEffect(() => {
    console.log("🔍 ConfidentialToken Balance Debug:", {
      encryptedBalance,
      balance,
      balanceFormatted,
      symbol,
      decimals,
      isLoadingBalance,
      isDecrypting,
      balanceError: balanceError?.message,
    });
  }, [encryptedBalance, balance, balanceFormatted, symbol, decimals, isLoadingBalance, isDecrypting, balanceError]);

  // Transfer operations
  const {
    transfer,
    isLoading: isTransferring,
    isSuccess: transferSuccess,
    error: transferError,
    reset: resetTransfer,
  } = useTokenTransfer({
    name: "ConfidentialToken",
    isConfidential: true,
  });

  // Show success toast
  useEffect(() => {
    if (transferSuccess) {
      toast.success("Transfer successful! 🎉");
      setTimeout(() => {
        refetchBalance();
        resetTransfer();
        setRecipient("");
        setAmount("");
      }, 2000);
    }
  }, [transferSuccess, refetchBalance, resetTransfer]);

  // Show error toast
  useEffect(() => {
    if (transferError) {
      const message = getUserFriendlyError(transferError);
      toast.error(message);
    }
  }, [transferError]);

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!decimals) {
      toast.error("Token decimals not loaded");
      return;
    }

    try {
      console.log("🚀 Attempting transfer:", {
        recipient,
        amount,
        decimals,
      });

      await transfer({
        to: recipient as `0x${string}`,
        amount,
        decimals,
      });
    } catch (error) {
      console.error("❌ Transfer failed:", error);
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
            <p className="text-gray-700 mb-6">Connect your wallet to use the Confidential Token demo.</p>
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

  if (!isSepoliaNetwork) {
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
              Confidential Token is only available on Sepolia. Please switch networks.
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={() => open({ view: "Networks" })}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 bg-blue-600 text-white hover:bg-blue-700"
              >
                Switch to Sepolia
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
        <h1 className="text-4xl font-bold mb-2">🔐 Confidential Token Demo</h1>
        <p className="text-gray-600 text-lg">ERC-20 with Fully Encrypted Balances</p>
        <p className="text-sm text-gray-500 mt-2">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)} on Sepolia
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Balance</h2>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8 mb-6 border border-purple-200">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Encrypted Balance</p>
              <div className="bg-white p-4 rounded border border-gray-300 shadow-sm">
                <p className="font-mono text-xs break-all text-gray-800">
                  {encryptedBalance || (isLoadingBalance ? "Loading..." : "Not available")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Decrypted Balance</p>
              {isDecrypting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="text-lg text-gray-600">Decrypting...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-6xl font-bold text-purple-600">{balance || "0"}</p>
                  {symbol && <p className="text-xl text-gray-500 mt-2">{symbol}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => refetchBalance()}
          disabled={isLoadingBalance || isDecrypting}
          className={`${buttonClass} bg-purple-600 text-white hover:bg-purple-700 w-full text-lg`}
        >
          {isLoadingBalance ? "⏳ Loading..." : "🔄 Refresh Balance"}
        </button>

        {balanceError && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">❌ Error: {balanceError.message}</p>
          </div>
        )}
      </div>

      {/* Transfer Card */}
      <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer Tokens</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-mono text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold text-gray-900"
            />
          </div>

          <button
            onClick={handleTransfer}
            disabled={isTransferring || !recipient || !amount}
            className={`${buttonClass} bg-pink-600 text-white hover:bg-pink-700 w-full text-lg`}
          >
            {isTransferring ? "⏳ Transferring..." : "💸 Transfer"}
          </button>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">✨ Token Features</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-lg">✓</span>
              <span>
                <strong>Encrypted Balances:</strong> All balances stored encrypted on-chain
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-lg">✓</span>
              <span>
                <strong>Private Transfers:</strong> Transfer amounts are never revealed
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-lg">✓</span>
              <span>
                <strong>Auto-decrypt:</strong> SDK automatically decrypts your balance
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-lg">✓</span>
              <span>
                <strong>ERC-20 Compatible:</strong> Standard interface with privacy
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📍 Contract Info</h3>
          <ul className="space-y-3 text-sm text-gray-700 font-mono">
            <li className="flex flex-col">
              <span className="text-blue-600 font-bold mb-1">Address:</span>
              <span className="break-all">0xac4d3C0f90A6a4B5b8ae16AFd78F1EEcF238eD70</span>
            </li>
            <li className="flex flex-col">
              <span className="text-blue-600 font-bold mb-1">Network:</span>
              <span>Sepolia Testnet</span>
            </li>
            <li className="flex flex-col">
              <span className="text-blue-600 font-bold mb-1">Type:</span>
              <span>Confidential ERC-20</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const ConfidentialTokenDemo = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-900">
        <div className="flex items-center justify-center">
          <div className="bg-white border shadow-xl p-8 text-center rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return <ConfidentialTokenDemoInner />;
};
