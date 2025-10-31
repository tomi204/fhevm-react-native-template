---
sidebar_position: 1
---

# Hooks Overview

The FHEVM SDK provides a comprehensive set of React hooks for working with encrypted smart contracts. These hooks handle encryption, decryption, contract interactions, and state management automatically.

## Categories

### Contract Interaction Hooks

Hooks for reading and writing to smart contracts with automatic encryption/decryption:

- [useContract](./use-contract.md) - Get a contract instance
- [useReadContract](./use-read-contract.md) - Read from contracts with auto-decryption
- [useWriteContract](./use-write-contract.md) - Write to contracts with auto-encryption
- [useDecryptedValue](./use-decrypted-value.md) - Decrypt encrypted handles

### Token Hooks

Specialized hooks for token operations:

- [useTokenBalance](./use-token-balance.md) - Read token balances
- [useTokenTransfer](./use-token-transfer.md) - Transfer tokens (standard or confidential)

### Utility Hooks

Helper hooks for common operations:

- [useOperator](./use-operator.md) - Manage operator permissions
- [useBatchTransactions](./use-batch-transactions.md) - Batch multiple transactions

## Quick Reference

| Hook | Purpose | Auto-Encrypt | Auto-Decrypt |
|------|---------|--------------|--------------|
| `useContract` | Get contract instance | No | No |
| `useReadContract` | Read contract state | No | Yes |
| `useWriteContract` | Write to contract | Yes | No |
| `useDecryptedValue` | Decrypt a handle | No | Yes |
| `useTokenBalance` | Get token balance | No | Yes |
| `useTokenTransfer` | Transfer tokens | Yes | No |
| `useOperator` | Manage operators | Yes | No |
| `useBatchTransactions` | Batch operations | Yes | No |

## Common Patterns

### Pattern 1: Read Encrypted Data

```typescript
import { useReadContract } from '@fhevm/sdk';

function BalanceDisplay() {
  const { decryptedData, isLoading, isDecrypting } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: [userAddress],
    decrypt: true,
  });

  if (isLoading || isDecrypting) return <div>Loading...</div>;

  return <div>Balance: {decryptedData?.toString()}</div>;
}
```

### Pattern 2: Write Encrypted Data

```typescript
import { useWriteContract } from '@fhevm/sdk';

function TransferButton() {
  const { write, isLoading, isSuccess } = useWriteContract({
    address: '0x123...',
    abi: tokenAbi,
  });

  const handleTransfer = async () => {
    await write({
      functionName: 'confidentialTransfer',
      args: [recipientAddress, 100n],
    });
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? 'Transferring...' : 'Transfer'}
    </button>
  );
}
```

### Pattern 3: Use Named Contracts

```typescript
import { useReadContract } from '@fhevm/sdk';

function MyComponent() {
  // Reference contract by name from config
  const { decryptedData } = useReadContract({
    name: 'myToken', // From config
    functionName: 'balanceOf',
    args: [userAddress],
    decrypt: true,
  });

  return <div>{decryptedData?.toString()}</div>;
}
```

### Pattern 4: Conditional Fetching

```typescript
import { useReadContract } from '@fhevm/sdk';

function ConditionalFetch({ enabled }: { enabled: boolean }) {
  const { data, refetch } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'getData',
    enabled: enabled, // Only fetch when enabled
  });

  return (
    <div>
      {data && <p>Data: {data}</p>}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

## Hook Capabilities

### Automatic Encryption

Hooks like `useWriteContract` and `useTokenTransfer` automatically detect which parameters need encryption based on the ABI:

- `externalEuint*` types (e.g., `externalEuint64`)
- `euint*` types (e.g., `euint64`)
- `externalEbool` types

No manual encryption is needed:

```typescript
// This is automatically encrypted
write({
  functionName: 'transfer',
  args: [recipient, 100n], // Amount is encrypted if ABI specifies externalEuint64
});
```

### Automatic Decryption

Hooks like `useReadContract` and `useDecryptedValue` automatically decrypt encrypted return values:

- Detects bytes32 handles
- Requests decryption signature from user (once per session)
- Decrypts using FHEVM instance
- Caches results for performance

```typescript
// This is automatically decrypted
const { decryptedData } = useReadContract({
  functionName: 'getBalance',
  decrypt: true, // Enable auto-decrypt
});
```

### Type Safety

All hooks are fully typed with TypeScript:

```typescript
import { useWriteContract } from '@fhevm/sdk';
import type { MyTokenAbi } from './types';

function TypedComponent() {
  const { write } = useWriteContract<MyTokenAbi>({
    address: '0x123...',
    abi: myTokenAbi,
  });

  // TypeScript knows about your contract functions
  write({
    functionName: 'transfer', // Autocomplete works!
    args: [recipient, amount], // Type-checked!
  });
}
```

## Error Handling

All hooks provide error states:

```typescript
const { data, error, isError } = useReadContract({
  address: '0x123...',
  abi: tokenAbi,
  functionName: 'getData',
});

if (isError) {
  console.error('Failed to read:', error);
  return <div>Error: {error?.message}</div>;
}
```

## Loading States

Track loading and processing states:

```typescript
const {
  isLoading,     // Initial loading
  isDecrypting,  // Decryption in progress
  isSuccess,     // Operation succeeded
} = useReadContract({
  address: '0x123...',
  abi: tokenAbi,
  functionName: 'getData',
  decrypt: true,
});

return (
  <div>
    {isLoading && <Spinner />}
    {isDecrypting && <span>Decrypting...</span>}
    {isSuccess && <span>Success!</span>}
  </div>
);
```

## Context Requirements

Most hooks require the `FhevmProvider` to be present in the component tree:

```typescript
import { FhevmProvider } from '@fhevm/sdk';

function App() {
  return (
    <FhevmProvider config={config}>
      {/* Hooks can be used here */}
      <YourComponent />
    </FhevmProvider>
  );
}
```

## Next Steps

- Explore individual hooks:
  - [useContract](./use-contract.md) - Get contract instances
  - [useReadContract](./use-read-contract.md) - Read with auto-decryption
  - [useWriteContract](./use-write-contract.md) - Write with auto-encryption
- Learn about [Core Concepts](../core/overview.md)
- Check out [Examples](../examples/basic-usage.md)

:::tip Best Practice
Enable the cache in your configuration for better performance. Decryption operations can be slow, and caching significantly improves UX.
:::

:::warning Provider Required
All hooks must be used within a `FhevmProvider`. Make sure to wrap your app appropriately.
:::
