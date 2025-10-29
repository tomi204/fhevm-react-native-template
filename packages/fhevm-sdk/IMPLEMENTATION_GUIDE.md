# FHEVM SDK - Complete Implementation Guide

## 🚀 Full Implementation with Wallet Integration

This guide shows you how to implement the complete FHEVM SDK with wallet integration, exactly as demonstrated in our Next.js example.

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration Setup](#configuration-setup)
3. [Provider Setup](#provider-setup)
4. [Wallet Integration](#wallet-integration)
5. [Using Hooks](#using-hooks)
6. [Complete Example](#complete-example)
7. [Advanced Features](#advanced-features)

---

## Installation

```bash
npm install @fhevm-sdk ethers wagmi @rainbow-me/rainbowkit abitype
npm install @tanstack/react-query react-hot-toast
```

---

## Configuration Setup

### Step 1: Create FHEVM Config

Create `lib/fhevm-config.ts`:

```typescript
import { createConfig, registerContract } from "@fhevm-sdk";
import deployedContracts from "./contracts/deployedContracts";

const FHECounter = deployedContracts[31337].FHECounter;

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 31337,
      name: "Localhost",
      rpcUrl: "http://localhost:8545",
      isMock: true,
    },
    {
      id: 8009,
      name: "Zama Devnet",
      rpcUrl: "https://devnet.zama.ai",
      isMock: false,
    },
  ],
  contracts: {
    FHECounter: {
      address: FHECounter.address as `0x${string}`,
      abi: FHECounter.abi as any,
      name: "FHECounter",
    },
  },
  defaultMode: "local",
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});

// Register contracts for easy access
registerContract("FHECounter", {
  address: FHECounter.address as `0x${string}`,
  abi: FHECounter.abi as any,
});
```

---

## Provider Setup

### Step 2: Create Wallet Sync Component

Create `components/FhevmWagmiSync.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSyncWithWallet } from "@fhevm-sdk";
import { ethers } from "ethers";

export function FhevmWagmiSync() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.Provider | undefined>(undefined);

  useEffect(() => {
    if (walletClient) {
      const ethersProvider = new ethers.BrowserProvider(walletClient as any);
      setProvider(ethersProvider);
      ethersProvider.getSigner().then(setSigner);
    } else {
      setSigner(undefined);
      setProvider(undefined);
    }
  }, [walletClient]);

  useSyncWithWallet({
    chainId,
    address,
    signer,
    provider,
  });

  return null;
}
```

### Step 3: Setup Providers Wrapper

Update `components/DappWrapperWithProviders.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { FhevmProvider } from "@fhevm-sdk";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./services/web3/wagmiConfig";
import { fhevmConfig } from "./lib/fhevm-config";
import { FhevmWagmiSync } from "./components/FhevmWagmiSync";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function DappWrapperWithProviders({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FhevmProvider config={fhevmConfig}>
          <FhevmWagmiSync />
          <RainbowKitProvider
            avatar={BlockieAvatar}
            theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
          >
            {children}
          </RainbowKitProvider>
        </FhevmProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Wallet Integration

The SDK automatically syncs with wagmi and detects:
- ✅ Connected wallet address
- ✅ Current chain ID
- ✅ Ethers signer and provider
- ✅ EIP-1193 provider (window.ethereum)

No additional setup needed! The `FhevmWagmiSync` component handles everything.

---

## Using Hooks

### useReadContract - Read Encrypted Values

```typescript
import { useReadContract } from "@fhevm-sdk";

function MyComponent() {
  const {
    encryptedData,      // Raw encrypted handle
    decryptedData,      // Decrypted value (cached)
    isLoading,          // Loading state
    isDecrypting,       // Decrypting state
    error,              // Error object
    refetch,            // Manual refetch function
  } = useReadContract({
    name: "FHECounter",
    functionName: "getCount",
    enabled: true,      // Enable/disable
    watch: false,       // Auto-refresh every 5s
  });

  return (
    <div>
      <p>Encrypted: {encryptedData}</p>
      <p>Decrypted: {decryptedData?.toString()}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### useWriteContract - Write with Auto-Encryption

```typescript
import { useWriteContract, getUserFriendlyError } from "@fhevm-sdk";
import toast from "react-hot-toast";

function MyComponent() {
  const {
    write,              // Write function
    writeAsync,         // Async write function
    isLoading,          // Loading state
    isSuccess,          // Success state
    error,              // Error object
    reset,              // Reset state
  } = useWriteContract({
    name: "FHECounter",
  });

  const handleIncrement = async () => {
    try {
      await write({
        functionName: "increment",
        args: [5],        // SDK encrypts automatically!
      });
      toast.success("Success!");
    } catch (error) {
      const message = getUserFriendlyError(error);
      toast.error(message);
    }
  };

  return (
    <button onClick={handleIncrement} disabled={isLoading}>
      {isLoading ? "Processing..." : "Increment by 5"}
    </button>
  );
}
```

### useDecryptedValue - Decrypt Individual Values

```typescript
import { useDecryptedValue } from "@fhevm-sdk";

function DecryptValue({ handle, contractAddress }) {
  const {
    decryptedValue,
    isDecrypting,
    error,
    decrypt,
  } = useDecryptedValue({
    handle,
    contractAddress,
    enabled: true,
  });

  if (isDecrypting) return <span>Decrypting...</span>;
  if (error) return <span>Error: {error.message}</span>;
  return <span>{decryptedValue?.toString()}</span>;
}
```

---

## Complete Example

Here's the full implementation from our Next.js demo:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, getUserFriendlyError } from "@fhevm-sdk";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";

export function FHECounterDemo() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState(1);

  // Read encrypted counter
  const {
    encryptedData: handle,
    decryptedData: value,
    isLoading: isReading,
    isDecrypting,
    refetch,
  } = useReadContract({
    name: "FHECounter",
    functionName: "getCount",
    enabled: isConnected,
  });

  // Write operations
  const {
    write,
    isLoading: isWriting,
    isSuccess,
    error: writeError,
    reset,
  } = useWriteContract({
    name: "FHECounter",
  });

  // Success handling
  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction successful! 🎉");
      setTimeout(() => {
        refetch();
        reset();
      }, 2000);
    }
  }, [isSuccess, refetch, reset]);

  // Error handling
  useEffect(() => {
    if (writeError) {
      const message = getUserFriendlyError(writeError);
      toast.error(message);
    }
  }, [writeError]);

  const handleIncrement = async () => {
    await write({
      functionName: "increment",
      args: [amount], // Auto-encrypted!
    });
  };

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <h2>Connect Your Wallet</h2>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="counter-demo">
      <h1>FHE Counter</h1>
      <p>Connected: {address}</p>

      <div className="counter-display">
        <div>
          <label>Encrypted Handle</label>
          <code>{handle || "Loading..."}</code>
        </div>
        <div>
          <label>Decrypted Value</label>
          <h2>{isDecrypting ? "🔓..." : value?.toString() || "0"}</h2>
        </div>
      </div>

      <div className="controls">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1"
        />
        <button onClick={handleIncrement} disabled={isWriting}>
          {isWriting ? "Processing..." : `Increment by ${amount}`}
        </button>
        <button onClick={() => refetch()} disabled={isReading}>
          Refresh
        </button>
      </div>
    </div>
  );
}
```

---

## Advanced Features

### Batch Transactions

```typescript
import { useBatchTransactions, useContract } from "@fhevm-sdk";

function BatchDemo() {
  const { contract } = useContract({ name: "FHECounter" });
  const { addToBatch, executeBatch, batch, isExecuting, progress } = useBatchTransactions();

  const handleBatch = () => {
    addToBatch({ contract, functionName: "increment", args: [1] });
    addToBatch({ contract, functionName: "increment", args: [2] });
    addToBatch({ contract, functionName: "increment", args: [3] });
  };

  return (
    <div>
      <button onClick={handleBatch}>Add 3 Operations</button>
      <button onClick={executeBatch} disabled={isExecuting}>
        Execute {batch.length} Operations
      </button>
      {isExecuting && <progress value={progress} max={100} />}
    </div>
  );
}
```

### Operator Management

```typescript
import { useOperator } from "@fhevm-sdk";
import { useAccount } from "wagmi";

function OperatorSetup() {
  const { address } = useAccount();
  const {
    isOperator,
    setupOperator,
    isSettingUp,
  } = useOperator({
    name: "FHECounter",
    operatorAddress: address as `0x${string}`,
    autoSetup: true, // Auto-setup on mount
  });

  return (
    <div>
      {isOperator ? "✅ Operator Ready" : "⏳ Setting up..."}
    </div>
  );
}
```

### Cache Management

```typescript
import { useFhevmContext } from "@fhevm-sdk";

function CacheControl() {
  const { clearCache, decryptCache } = useFhevmContext();

  return (
    <div>
      <p>Cache size: {decryptCache.size}</p>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  );
}
```

---

## Testing Locally

### 1. Start Local Network

```bash
npx hardhat node
```

### 2. Deploy Contracts

```bash
npx hardhat deploy
```

### 3. Start Next.js

```bash
cd packages/nextjs
npm run dev
```

### 4. Open Browser

Visit http://localhost:3001

### 5. Connect Wallet

- Click "Connect Wallet"
- Select your wallet
- Connect to localhost network

### 6. Test Features

- ✅ Read encrypted counter
- ✅ Increment/decrement (auto-encrypt)
- ✅ Watch decryption happen
- ✅ See cached values
- ✅ Handle errors gracefully

---

## Common Patterns

### Loading States

```typescript
if (isLoading) return <Spinner />;
if (isDecrypting) return <div>🔓 Decrypting...</div>;
if (error) return <div>Error: {error.message}</div>;
return <div>Value: {decryptedData}</div>;
```

### Refetch After Write

```typescript
const { refetch } = useReadContract({ ... });
const { write } = useWriteContract({ ... });

const handleWrite = async () => {
  await write({ ... });
  setTimeout(() => refetch(), 2000);
};
```

### Conditional Fetching

```typescript
const { data } = useReadContract({
  name: "Token",
  functionName: "balanceOf",
  enabled: isConnected && hasPermission,
});
```

---

## Troubleshooting

### "Cannot decrypt value"

**Check:**
1. Wallet is connected
2. Correct network selected
3. Contract is deployed
4. You have decrypt permissions

### "Transaction reverted"

**Common causes:**
- Insufficient gas
- Invalid arguments
- Missing operator permissions

**Solution:**
Use `getUserFriendlyError()` for better messages:

```typescript
try {
  await write({ ... });
} catch (error) {
  const message = getUserFriendlyError(error);
  toast.error(message);
}
```

### "Contract not found"

**Make sure:**
1. Contract is registered in config
2. Address is correct
3. ABI is correct

---

## Performance Tips

1. **Enable caching** - Avoid redundant decryptions
2. **Use watch mode sparingly** - Only when you need real-time updates
3. **Batch operations** - Group multiple transactions
4. **Cache TTL** - Adjust based on your needs

---

## Security Best Practices

1. **Never expose private keys**
2. **Validate all inputs**
3. **Use operator permissions**
4. **Handle errors gracefully**
5. **Test on testnet first**

---

## Next Steps

- ✅ Read the [Quick Start Guide](./QUICK_START.md)
- ✅ Check [10+ Examples](./EXAMPLES.md)
- ✅ Explore [API Documentation](./README.md)
- ✅ Join [Discord Community](https://discord.gg/fhevm)

---

## Complete File Structure

```
your-project/
├── lib/
│   └── fhevm-config.ts          # SDK configuration
├── components/
│   ├── FhevmWagmiSync.tsx       # Wallet sync
│   └── DappWrapper.tsx          # Providers
├── app/
│   └── page.tsx                 # Your components
└── contracts/
    └── deployedContracts.ts     # Contract ABIs
```

---

## Summary

You now have a complete implementation of the FHEVM SDK with:

✅ **Wagmi integration** - Seamless wallet connection
✅ **Auto-encryption** - Just pass numbers
✅ **Auto-decryption** - Values decrypted automatically
✅ **Native caching** - Decrypt once, use everywhere
✅ **Error handling** - User-friendly messages
✅ **Type safety** - Full TypeScript support
✅ **Production ready** - Tested and battle-tested

**Happy building with FHE! 🚀🔐**
