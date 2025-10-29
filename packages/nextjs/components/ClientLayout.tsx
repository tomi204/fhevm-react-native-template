"use client";

import { useEffect, useState } from "react";
import { FhevmProvider, InMemoryStorageProvider } from "fhevm-sdk";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { HeaderReown } from "~~/components/HeaderReown";
import { fhevmConfig } from "~~/lib/fhevm-config";
import scaffoldConfig from "~~/scaffold.config";
import { wagmiAdapter } from "~~/services/web3/reownConfig";
import { FhevmWagmiSync } from "~~/components/FhevmWagmiSync";

const queryClient = new QueryClient();

/**
 * Client-side layout following standard Reown/AppKit architecture
 *
 * Provider order (CRITICAL - DO NOT CHANGE):
 * 1. ThemeProvider (theme management)
 * 2. WagmiProvider (wagmi hooks)
 * 3. QueryClientProvider (react-query)
 * 4. FhevmProvider (FHEVM context - MUST be inside WagmiProvider)
 * 5. FhevmWagmiSync (syncs wagmi state with FHEVM)
 * 6. createAppKit (Reown modal initialization)
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [appKitReady, setAppKitReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize Reown AppKit after component mounts (standard Reown pattern)
    if (mounted && typeof window !== "undefined") {
      try {
        createAppKit({
          adapters: [wagmiAdapter as any],
          projectId: scaffoldConfig.walletConnectProjectId,
          networks: wagmiAdapter.wagmiConfig.chains as any,
          metadata: {
            name: "FHEVM dApp",
            description: "Fully Homomorphic Encryption Application",
            url: window.location.origin,
            icons: ["https://avatars.githubusercontent.com/u/37784886"],
          },
          features: {
            analytics: true,
          },
        } as any);

        // Give AppKit time to initialize before rendering components that use it
        setTimeout(() => setAppKitReady(true), 500);
      } catch (error) {
        console.error("Failed to initialize AppKit:", error);
        setAppKitReady(true);
      }
    }
  }, [mounted]);

  // Don't render providers until mounted and AppKit ready to avoid SSR/hydration issues
  if (!mounted || !appKitReady) {
    return (
      <ThemeProvider enableSystem>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider enableSystem>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <FhevmProvider config={fhevmConfig}>
            <FhevmWagmiSync />
            <ProgressBar height="3px" color="#2299dd" />
            <div className="flex flex-col min-h-screen">
              <HeaderReown />
              <main className="relative flex flex-col flex-1">
                <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
              </main>
            </div>
            <Toaster />
          </FhevmProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
