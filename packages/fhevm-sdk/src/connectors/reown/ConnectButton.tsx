"use client";

import React from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";

export type ConnectButtonProps = {
  label?: string;
  className?: string;
  showBalance?: boolean;
  showNetwork?: boolean;
};

function ConnectButtonInner({
  label = "Connect Wallet",
  className = "",
  showBalance = false,
  showNetwork = false,
}: ConnectButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const defaultClassName =
    "px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";

  if (!isConnected) {
    return (
      <button onClick={() => open()} className={className || `${defaultClassName} bg-blue-600 text-white hover:bg-blue-700`}>
        {label}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showNetwork && chain && (
        <button
          onClick={() => open({ view: "Networks" })}
          className={`${defaultClassName} bg-gray-200 text-gray-800 hover:bg-gray-300`}
        >
          {chain.name}
        </button>
      )}
      <button onClick={() => open()} className={`${defaultClassName} bg-gray-800 text-white hover:bg-gray-900`}>
        {formatAddress(address!)}
      </button>
      <button
        onClick={() => disconnect()}
        className={`${defaultClassName} bg-red-600 text-white hover:bg-red-700`}
      >
        Disconnect
      </button>
    </div>
  );
}

export function ConnectButton(props: ConnectButtonProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const defaultClassName =
    "px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";

  // Don't render until mounted on client to avoid SSR issues with AppKit
  if (!mounted) {
    return (
      <button disabled className={props.className || `${defaultClassName} bg-gray-400 text-white cursor-wait`}>
        Loading...
      </button>
    );
  }

  return <ConnectButtonInner {...props} />;
}
