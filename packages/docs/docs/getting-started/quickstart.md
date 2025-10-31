---
sidebar_position: 1
---

# Quickstart Guide

Get started with the FHEVM SDK in minutes. This guide will show you how to set up your application and perform your first encrypted transaction.

## Installation

Install the FHEVM SDK package:

```bash
npm install @fhevm/sdk
# or
yarn add @fhevm/sdk
# or
pnpm add @fhevm/sdk
```

## Basic Setup

### 1. Create Configuration

First, create a configuration for your FHEVM application:

```typescript
import { createConfig } from '@fhevm/sdk';

const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
      isMock: false,
    },
  ],
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});
```

### 2. Wrap Your App with FhevmProvider

Wrap your application with the `FhevmProvider` to make FHEVM functionality available throughout your app:

```typescript
import { FhevmProvider } from '@fhevm/sdk';

function App() {
  return (
    <FhevmProvider config={config}>
      <YourApp />
    </FhevmProvider>
  );
}
```

### 3. Connect Wallet

Use the provider to sync with your wallet provider (e.g., wagmi, ethers):

```typescript
import { useSyncWithWallet } from '@fhevm/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { useMemo } from 'react';
import { BrowserProvider } from 'ethers';

function YourComponent() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const ethersSigner = useMemo(() => {
    if (!walletClient) return undefined;
    const provider = new BrowserProvider(walletClient);
    return provider.getSigner();
  }, [walletClient]);

  useSyncWithWallet({
    address,
    chainId,
    signer: ethersSigner,
  });

  return <div>Connected: {address}</div>;
}
```

## Your First Encrypted Transaction

### Reading Encrypted Data

Use the `useReadContract` hook to read from a contract. The SDK automatically decrypts encrypted return values:

```typescript
import { useReadContract } from '@fhevm/sdk';

function BalanceDisplay() {
  const { decryptedData, isLoading, isDecrypting } = useReadContract({
    address: '0x123...',
    abi: myTokenAbi,
    functionName: 'balanceOf',
    args: [userAddress],
    decrypt: true, // Automatically decrypt the result
  });

  if (isLoading || isDecrypting) {
    return <div>Loading...</div>;
  }

  return <div>Balance: {decryptedData?.toString()}</div>;
}
```

### Writing Encrypted Data

Use the `useWriteContract` hook to write encrypted data. The SDK automatically encrypts your inputs:

```typescript
import { useWriteContract } from '@fhevm/sdk';

function TransferButton() {
  const { write, isLoading } = useWriteContract({
    address: '0x123...',
    abi: myTokenAbi,
  });

  const handleTransfer = async () => {
    await write({
      functionName: 'confidentialTransfer',
      args: [recipientAddress, 100n], // Amount automatically encrypted
    });
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? 'Transferring...' : 'Transfer'}
    </button>
  );
}
```

### Using Token Transfer Hook

For token transfers, use the specialized `useTokenTransfer` hook:

```typescript
import { useTokenTransfer } from '@fhevm/sdk';

function TokenTransfer() {
  const { transfer, isLoading, isSuccess } = useTokenTransfer({
    address: '0x123...',
    abi: myTokenAbi,
    isConfidential: true, // Use confidentialTransfer
  });

  const handleTransfer = async () => {
    await transfer({
      to: '0x456...',
      amount: '100', // Human-readable amount
      decimals: 18,
    });
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={isLoading}>
        Transfer Tokens
      </button>
      {isSuccess && <p>Transfer successful!</p>}
    </div>
  );
}
```

## Complete Example

Here's a complete example bringing it all together:

```typescript
import { createConfig, FhevmProvider, useReadContract, useWriteContract, useSyncWithWallet } from '@fhevm/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useMemo } from 'react';

// 1. Create config
const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
    },
  ],
});

// 2. Main App Component
function App() {
  return (
    <FhevmProvider config={config}>
      <WalletSync />
      <EncryptedCounter />
    </FhevmProvider>
  );
}

// 3. Sync with wallet
function WalletSync() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const ethersSigner = useMemo(() => {
    if (!walletClient) return undefined;
    const provider = new BrowserProvider(walletClient);
    return provider.getSigner();
  }, [walletClient]);

  useSyncWithWallet({ address, chainId, signer: ethersSigner });
  return null;
}

// 4. Use encrypted contract
function EncryptedCounter() {
  const { decryptedData, isLoading } = useReadContract({
    address: '0x123...',
    abi: counterAbi,
    functionName: 'getCount',
    decrypt: true,
  });

  const { write, isLoading: isWriting } = useWriteContract({
    address: '0x123...',
    abi: counterAbi,
  });

  return (
    <div>
      <p>Count: {isLoading ? 'Loading...' : decryptedData?.toString()}</p>
      <button
        onClick={() => write({ functionName: 'increment', args: [1] })}
        disabled={isWriting}
      >
        Increment
      </button>
    </div>
  );
}

export default App;
```

## Next Steps

- Learn about [Configuration Options](./configuration.md)
- Explore [Available Hooks](../hooks/overview.md)
- Understand [Core Concepts](../core/overview.md)
- Check out [Examples](../examples/basic-usage.md)

## Common Issues

:::warning Cache Configuration
Make sure to enable caching for better performance. Decryption operations can be slow, and caching significantly improves the user experience.
:::

:::note TypeScript Support
The SDK is fully typed. Make sure to use TypeScript for the best development experience and to catch errors at compile time.
:::

:::tip Testing
For testing, you can use mock chains by setting `isMock: true` in your chain configuration. This allows you to test your application without connecting to a real network.
:::
