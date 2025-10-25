"use client";

import { useEffect, useMemo, useState } from "react";
import { type FheClient, createFheClient, useFheCounter } from "@fhevm-sdk";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { useDeployedContractInfo } from "~~/hooks/helper";
import { useWagmiEthers } from "~~/hooks/wagmi/useWagmiEthers";

export const FHECounterDemo = () => {
  const { isConnected, chain } = useAccount();
  const chainId = chain?.id;
  const initialMockChains = { 31337: "http://localhost:8545" };
  const eip1193Provider = useMemo(() => (typeof window !== "undefined" ? (window as any).ethereum : undefined), []);
  const { data: fheCounterContract } = useDeployedContractInfo({ contractName: "FHECounter", chainId });
  const { ethersSigner } = useWagmiEthers(initialMockChains);

  const [client, setClient] = useState<FheClient | undefined>(undefined);
  const [clientStatus, setClientStatus] = useState<"idle" | "connecting" | "ready" | "error">("idle");
  const [clientError, setClientError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ethersSigner || !fheCounterContract?.address || !eip1193Provider) {
      setClient(undefined);
      setClientStatus("idle");
      setClientError(undefined);
      return;
    }
    let cancelled = false;
    setClientStatus("connecting");
    setClientError(undefined);
    createFheClient({
      contract: {
        address: fheCounterContract.address as `0x${string}`,
        abi: fheCounterContract.abi as any[],
        name: "FHECounter",
      },
      mode: "local",
      provider: eip1193Provider,
      signer: ethersSigner,
      chainId,
      mockChains: initialMockChains,
    })
      .then(newClient => {
        if (cancelled) return;
        setClient(newClient);
        setClientStatus("ready");
      })
      .catch(err => {
        if (cancelled) return;
        setClientError(err instanceof Error ? err.message : String(err));
        setClientStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ethersSigner, fheCounterContract?.address, fheCounterContract?.abi, eip1193Provider, chainId]);

  const counter = useFheCounter({ client });

  const buttonClass =
    "inline-flex items-center justify-center px-6 py-3 font-semibold shadow-lg transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
  const primaryButtonClass = buttonClass + " bg-[#FFD208] text-[#2D2D2D] hover:bg-[#A38025] focus-visible:ring-[#2D2D2D]";
  const secondaryButtonClass = buttonClass + " bg-black text-[#F4F4F4] hover:bg-[#1F1F1F] focus-visible:ring-[#FFD208]";
  const titleClass = "font-bold text-gray-900 text-xl mb-4 border-b-1 border-gray-700 pb-2";
  const sectionClass = "bg-[#f4f4f4] shadow-lg p-6 mb-6 text-gray-900";

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-gray-900">
        <div className="flex items-center justify-center">
          <div className="bg-white bordershadow-xl p-8 text-center">
            <div className="mb-4">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-900/30 text-amber-400 text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Wallet not connected</h2>
            <p className="text-gray-700 mb-6">Connect your wallet to use the FHE Counter demo.</p>
            <div className="flex items-center justify-center">
              <RainbowKitCustomConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (clientStatus === "connecting" || clientStatus === "idle") {
    return <div className="text-center text-gray-900">Preparing FHE client…</div>;
  }

  if (!client || clientStatus === "error") {
    return (
      <div className="text-center text-gray-900">
        <p>Unable to initialize FHE client.</p>
        {clientError && <p className="text-red-600 text-sm">{clientError}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-900">
      <div className="text-center mb-8 text-black">
        <h1 className="text-3xl font-bold mb-2">FHE Counter Demo</h1>
        <p className="text-gray-600">Interact with the Fully Homomorphic Encryption Counter contract</p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>🔢 Counter</h3>
        {printProperty("Encrypted Handle", counter.handle ?? "No handle available")}
        {printProperty("Decrypted Value", counter.value ?? "Not decrypted yet")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
        <button className={secondaryButtonClass} disabled={counter.isLoading} onClick={() => counter.refresh()}>
          {counter.isLoading ? "⏳ Refreshing" : "Refresh"}
        </button>
        <div className="flex flex-col md:flex-row gap-4">
          <button className={primaryButtonClass} disabled={!counter.canMutate} onClick={counter.increment}>
            {counter.isMutating ? "⏳ Working" : "➕ Increment"}
          </button>
          <button className={secondaryButtonClass} disabled={!counter.canMutate} onClick={counter.decrement}>
            {counter.isMutating ? "⏳ Working" : "➖ Decrement"}
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>💬 Messages</h3>
        {printProperty("Status", counter.message ?? "Idle")}
        {printProperty("Error", counter.error ?? "None")}
      </div>
    </div>
  );
};

function printProperty(name: string, value: unknown) {
  let displayValue: string;
  if (typeof value === "boolean") {
    return printBooleanProperty(name, value);
  } else if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    displayValue = String(value);
  } else if (value === null) {
    displayValue = "null";
  } else if (value === undefined) {
    displayValue = "undefined";
  } else if (value instanceof Error) {
    displayValue = value.message;
  } else {
    displayValue = JSON.stringify(value);
  }
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 w-full">
      <span className="text-gray-800 font-medium">{name}</span>
      <span className="ml-2 font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 border border-gray-300">{displayValue}</span>
    </div>
  );
}

function printBooleanProperty(name: string, value: boolean) {
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 w-full">
      <span className="text-gray-700 font-medium">{name}</span>
      <span
        className={`font-mono text-sm font-semibold px-2 py-1 border ${
          value ? "text-green-800 bg-green-100 border-green-300" : "text-red-800 bg-red-100 border-red-300"
        }`}
      >
        {value ? "✓ true" : "✗ false"}
      </span>
    </div>
  );
}
