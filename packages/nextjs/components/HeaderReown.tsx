"use client";

import React, { useRef } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { useOutsideClick } from "~~/hooks/helper";

/**
 * Site header with Reown/WalletConnect integration
 * Uses standard Reown AppKit button pattern
 */
export const HeaderReown = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  const { open } = useAppKit();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="sticky lg:static top-0 navbar min-h-0 shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-end grow mr-4">
        {!isConnected ? (
          <button
            onClick={() => open()}
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 bg-blue-600 text-white hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => open({ view: "Networks" })}
              className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              {chain?.name || "Unknown"}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              {formatAddress(address!)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
