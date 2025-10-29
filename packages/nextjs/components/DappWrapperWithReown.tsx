"use client";

import { useEffect, useState } from "react";
import { InMemoryStorageProvider, FhevmProvider, ReownProvider } from "fhevm-sdk";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { HeaderReown } from "~~/components/HeaderReown";
import { fhevmConfig } from "~~/lib/fhevm-config";
import scaffoldConfig from "~~/scaffold.config";
import { wagmiAdapter } from "~~/services/web3/reownConfig";

/**
 * DappWrapper that uses Reown AppKit instead of RainbowKit
 *
 * This provides native Reown/WalletConnect integration from the FHEVM SDK.
 *
 * Benefits of using Reown:
 * - Native integration in FHEVM SDK
 * - Automatic wallet sync with FHEVM context
 * - Built-in connect button via AppKit modal
 * - Modern WalletConnect v3 protocol
 * - 300+ wallet support
 */
export const DappWrapperWithReown = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render providers until mounted on client to avoid SSR/hydration issues
  if (!mounted) {
    return (
      <>
        <ProgressBar height="3px" color="#2299dd" />
        <div className={`flex flex-col min-h-screen items-center justify-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <FhevmProvider config={fhevmConfig}>
      <ReownProvider
        wagmiAdapter={wagmiAdapter}
        projectId={scaffoldConfig.walletConnectProjectId}
        metadata={{
          name: "FHEVM dApp",
          description: "Fully Homomorphic Encryption Application",
          url: typeof window !== "undefined" ? window.location.origin : "https://fhevm.io",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        }}
      >
        <ProgressBar height="3px" color="#2299dd" />
        <div className={`flex flex-col min-h-screen`}>
          <HeaderReown />
          <main className="relative flex flex-col flex-1">
            <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
          </main>
        </div>
        <Toaster />
      </ReownProvider>
    </FhevmProvider>
  );
};
