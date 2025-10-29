# FHEVM SDK - The Best Developer Experience for Fully Homomorphic Encryption

Welcome to the most developer-friendly SDK for building encrypted applications! This SDK provides a wagmi-like API that makes working with FHE (Fully Homomorphic Encryption) as simple as working with regular smart contracts.

## Features

- 🎯 **Wagmi-like API** - If you know wagmi, you already know this SDK
- 🔐 **Automatic Encryption/Decryption** - Just pass numbers, we handle the crypto
- 💾 **Native Caching** - Decrypt once, use everywhere
- 🔄 **Auto-refresh** - Watch mode for real-time updates
- 📦 **Contract Registry** - Register contracts once, use anywhere
- 🎨 **TypeScript First** - Full type safety with abitype
- ⚡ **Operator Management** - Automatic operator setup and management
- 🔗 **Reown Integration** - Built-in wallet connect support
- 🎭 **Batch Transactions** - Group multiple operations
- 🚀 **Error Handling** - User-friendly error messages

## Installation

```bash
npm install @fhevm-sdk ethers wagmi
```

## Quick Start

### 1. Create your config

```typescript
import { createConfig } from "@fhevm-sdk";

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 8009,
      name: "Zama Devnet",
      rpcUrl: "https://devnet.zama.ai",
    },
  ],
  contracts: {
    MyToken: {
      address: "0x...",
      abi: MyTokenABI,
    },
  },
  defaultMode: "local",
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});
```

### 2. Wrap your app with FhevmProvider

```typescript
import { FhevmProvider } from "@fhevm-sdk";
import { fhevmConfig } from "./config";

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <FhevmProvider config={fhevmConfig}>
        <YourApp />
      </FhevmProvider>
    </WagmiProvider>
  );
}
```

### 3. Sync with wagmi (optional)

```typescript
import { FhevmWagmiSync } from "@fhevm-sdk";

function Layout() {
  return (
    <>
      <FhevmWagmiSync />
      {/* Your components */}
    </>
  );
}
```

## Core Hooks

### useReadContract

Read and automatically decrypt values from contracts.

```typescript
import { useReadContract } from "@fhevm-sdk";

function Balance() {
  const {
    decryptedData: balance,
    isLoading,
    isDecrypting,
    refetch
  } = useReadContract({
    name: "MyToken",
    functionName: "balanceOf",
    args: [address],
    watch: true, // Auto-refresh every 5 seconds
  });

  return <div>Balance: {balance?.toString()}</div>;
}
```

### useWriteContract

Write to contracts with automatic encryption.

```typescript
import { useWriteContract } from "@fhevm-sdk";

function Transfer() {
  const { write, isLoading, isSuccess } = useWriteContract({
    name: "MyToken",
  });

  const handleTransfer = async () => {
    await write({
      functionName: "transfer",
      args: [recipient, 100], // SDK automatically encrypts 100!
    });
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? "Transferring..." : "Transfer 100 tokens"}
    </button>
  );
}
```

### useDecryptedValue

Decrypt individual values with automatic caching.

```typescript
import { useDecryptedValue } from "@fhevm-sdk";

function DecryptedAmount({ handle, contractAddress }) {
  const { decryptedValue, isDecrypting } = useDecryptedValue({
    handle,
    contractAddress,
  });

  if (isDecrypting) return <span>Decrypting...</span>;
  return <span>{decryptedValue?.toString()}</span>;
}
```

### useOperator

Manage operators automatically.

```typescript
import { useOperator } from "@fhevm-sdk";

function OperatorSetup() {
  const { isOperator, ensureOperator, isSettingUp } = useOperator({
    name: "MyToken",
    operatorAddress: "0x...",
    autoSetup: true, // Automatically setup if not operator
  });

  return (
    <div>
      {isOperator ? "✅ Operator set" : "❌ Not an operator"}
    </div>
  );
}
```

### useBatchTransactions

Group multiple transactions together.

```typescript
import { useBatchTransactions, useContract } from "@fhevm-sdk";

function BatchOperations() {
  const { contract } = useContract({ name: "MyToken" });
  const {
    addToBatch,
    executeBatch,
    batch,
    isExecuting,
    progress
  } = useBatchTransactions();

  const handleBatch = () => {
    addToBatch({
      contract,
      functionName: "transfer",
      args: [address1, 100],
    });
    addToBatch({
      contract,
      functionName: "transfer",
      args: [address2, 200],
    });
  };

  return (
    <>
      <button onClick={handleBatch}>Add to Batch</button>
      <button onClick={executeBatch} disabled={isExecuting}>
        Execute {batch.length} transactions
      </button>
      {isExecuting && <progress value={progress} max={100} />}
    </>
  );
}
```

## Contract Registry

Register contracts for easy access throughout your app.

```typescript
import { registerContract } from "@fhevm-sdk";

// Register once
registerContract("MyToken", {
  address: "0x...",
  abi: MyTokenABI,
});

// Use anywhere
const { contract } = useContract({ name: "MyToken" });
```

## Error Handling

The SDK provides user-friendly error messages automatically.

```typescript
import { getUserFriendlyError } from "@fhevm-sdk";

try {
  await write({ functionName: "transfer", args: [recipient, amount] });
} catch (error) {
  const friendlyMessage = getUserFriendlyError(error);
  toast.error(friendlyMessage);
}
```

## Reown (WalletConnect) Integration

Built-in support for Reown/WalletConnect.

```typescript
import { ReownProvider, ConnectButton } from "@fhevm-sdk";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const wagmiAdapter = new WagmiAdapter({
  // your config
});

function App() {
  return (
    <ReownProvider
      wagmiAdapter={wagmiAdapter}
      projectId="your-project-id"
    >
      <ConnectButton
        showBalance
        showNetwork
      />
    </ReownProvider>
  );
}
```

## Advanced Features

### Custom Cache Configuration

```typescript
const config = createConfig({
  cache: {
    enabled: true,
    ttl: 120000, // 2 minutes
  },
});
```

### Manual Cache Control

```typescript
import { useFhevmContext } from "@fhevm-sdk";

function CacheControl() {
  const { clearCache } = useFhevmContext();

  return (
    <button onClick={clearCache}>
      Clear Decrypt Cache
    </button>
  );
}
```

### Multiple Contracts

```typescript
const config = createConfig({
  contracts: {
    Token1: { address: "0x...", abi: Token1ABI },
    Token2: { address: "0x...", abi: Token2ABI },
    NFT: { address: "0x...", abi: NFTABI },
  },
});

// Use different contracts
const token1 = useReadContract({ name: "Token1", functionName: "balanceOf" });
const token2 = useReadContract({ name: "Token2", functionName: "balanceOf" });
```

## API Reference

### Configuration

#### createConfig(options)

Creates an FHEVM configuration.

**Options:**
- `chains`: Array of chain configurations
- `contracts`: Contract registry
- `relayer`: Relayer configuration (optional)
- `defaultMode`: "local" or "remote" (default: "local")
- `cache`: Cache configuration

#### FhevmProvider

React provider component that manages FHEVM state.

**Props:**
- `config`: FHEVM configuration
- `children`: React children

### Hooks

All hooks return reactive state that updates when dependencies change.

#### useReadContract

**Parameters:**
- `address` or `name`: Contract address or registered name
- `abi`: Contract ABI (if not using name)
- `functionName`: Function to call
- `args`: Function arguments (optional)
- `enabled`: Enable/disable hook (default: true)
- `watch`: Auto-refresh (default: false)
- `decrypt`: Auto-decrypt result (default: true)

**Returns:**
- `data`: Raw data
- `encryptedData`: Encrypted handle
- `decryptedData`: Decrypted value
- `isLoading`: Loading state
- `isDecrypting`: Decrypting state
- `isError`: Error state
- `error`: Error object
- `refetch`: Manual refetch function

#### useWriteContract

**Parameters:**
- `address` or `name`: Contract address or registered name
- `abi`: Contract ABI (if not using name)

**Returns:**
- `write`: Write function
- `writeAsync`: Async write function
- `data`: Transaction receipt
- `isLoading`: Loading state
- `isSuccess`: Success state
- `isError`: Error state
- `error`: Error object
- `reset`: Reset state function

## Examples

Check the `examples/` directory for complete examples:

- Basic Counter: Simple encrypted counter
- Token Transfer: ERC20-like token with encrypted balances
- DAO Voting: Encrypted voting system
- Batch Operations: Multiple operations in one batch

## Best Practices

1. **Use the contract registry** - Register contracts once, use everywhere
2. **Enable caching** - Avoid redundant decryptions
3. **Use watch mode** - Keep data fresh automatically
4. **Handle errors gracefully** - Use getUserFriendlyError()
5. **Batch when possible** - Group multiple operations
6. **Setup operators once** - Use autoSetup: true

## Contributing

We welcome contributions! Please see CONTRIBUTING.md

## License

MIT

## Support

- Documentation: https://docs.fhevm.io
- Discord: https://discord.gg/fhevm
- GitHub Issues: https://github.com/zama-ai/fhevm-sdk/issues
