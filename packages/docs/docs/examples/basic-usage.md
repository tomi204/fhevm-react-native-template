---
sidebar_position: 1
---

# Basic Usage

A complete example showing basic FHEVM SDK usage with an encrypted counter contract.

## Setup

### Install Dependencies

```bash
npm install @fhevm/sdk wagmi viem ethers
```

### Create Configuration

```typescript
// config.ts
import { createConfig } from '@fhevm/sdk';

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
    },
  ],
  contracts: {
    counter: {
      address: '0x1234567890123456789012345678901234567890',
      abi: counterAbi,
    },
  },
  cache: {
    enabled: true,
    ttl: 60000,
  },
});
```

### Counter Contract ABI

```typescript
// abis/counter.ts
export const counterAbi = [
  {
    name: 'getCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'increment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'bytes32', internalType: 'externalEuint64' }, { name: 'inputProof', type: 'bytes' }],
    outputs: [],
  },
  {
    name: 'decrement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'bytes32', internalType: 'externalEuint64' }, { name: 'inputProof', type: 'bytes' }],
    outputs: [],
  },
] as const;
```

## Application Structure

### App.tsx

```typescript
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FhevmProvider } from '@fhevm/sdk';
import { fhevmConfig } from './config';
import { wagmiConfig } from './wagmi';
import { Counter } from './Counter';
import { WalletSync } from './WalletSync';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FhevmProvider config={fhevmConfig}>
          <WalletSync />
          <Counter />
        </FhevmProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
```

### WalletSync.tsx

```typescript
import { useSyncWithWallet } from '@fhevm/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useMemo } from 'react';

export function WalletSync() {
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

  return null;
}
```

### Counter.tsx

```typescript
import { useReadContract, useWriteContract } from '@fhevm/sdk';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function Counter() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('1');

  // Read current count
  const { decryptedData, isLoading, isDecrypting, refetch } = useReadContract({
    name: 'counter',
    functionName: 'getCount',
    decrypt: true,
  });

  // Write operations
  const { write, isLoading: isWriting } = useWriteContract({
    name: 'counter',
  });

  const handleIncrement = async () => {
    await write({
      functionName: 'increment',
      args: [BigInt(amount)],
    });
    // Refetch after successful write
    setTimeout(() => refetch(), 2000);
  };

  const handleDecrement = async () => {
    await write({
      functionName: 'decrement',
      args: [BigInt(amount)],
    });
    setTimeout(() => refetch(), 2000);
  };

  if (!isConnected) {
    return (
      <div className="counter">
        <p>Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="counter">
      <h2>Encrypted Counter</h2>

      <div className="count-display">
        {isLoading || isDecrypting ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="count">{decryptedData?.toString() || '0'}</div>
        )}
      </div>

      <div className="controls">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          disabled={isWriting}
        />

        <button
          onClick={handleIncrement}
          disabled={isWriting || isLoading}
        >
          {isWriting ? 'Processing...' : 'Increment'}
        </button>

        <button
          onClick={handleDecrement}
          disabled={isWriting || isLoading}
        >
          {isWriting ? 'Processing...' : 'Decrement'}
        </button>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
```

### Styling

```css
/* Counter.css */
.counter {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.count-display {
  text-align: center;
  margin: 2rem 0;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
}

.loading {
  font-size: 1.5rem;
  color: #666;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}

.controls input {
  padding: 0.5rem;
  font-size: 1rem;
}

.controls button {
  padding: 0.75rem;
  font-size: 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover:not(:disabled) {
  background: #0056b3;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## Key Points

### 1. Automatic Encryption

Amount is automatically encrypted:

```typescript
write({
  functionName: 'increment',
  args: [BigInt(amount)], // Encrypted automatically
});
```

### 2. Automatic Decryption

Count is automatically decrypted:

```typescript
const { decryptedData } = useReadContract({
  functionName: 'getCount',
  decrypt: true, // Decrypts automatically
});
```

### 3. Loading States

Handle all loading states:

```typescript
{isLoading || isDecrypting ? (
  <div>Loading...</div>
) : (
  <div>{decryptedData}</div>
)}
```

### 4. Wallet Integration

Sync FHEVM with wallet:

```typescript
useSyncWithWallet({
  address,
  chainId,
  signer: ethersSigner,
});
```

## Running the Example

1. Install dependencies
2. Configure your contract addresses
3. Start development server
4. Connect wallet
5. Interact with counter

```bash
npm install
npm run dev
```

## Next Steps

- Explore [Encrypted ERC20](./encrypted-erc20.md)
- Learn about [Confidential Voting](./confidential-voting.md)
- See [React Native Example](./react-native.md)
