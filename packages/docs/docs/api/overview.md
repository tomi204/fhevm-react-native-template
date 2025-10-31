---
sidebar_position: 1
---

# API Reference Overview

Complete API reference for the FHEVM SDK.

## Module Structure

```
@fhevm/sdk
├── config/          # Configuration utilities
├── hooks/           # React hooks
├── core/            # Core encryption/decryption
├── storage/         # Storage adapters
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Main Exports

### Configuration

```typescript
import {
  createConfig,
  FhevmProvider,
  useFhevmContext,
  useSyncWithWallet,
} from '@fhevm/sdk';
```

### Hooks

```typescript
import {
  useContract,
  useReadContract,
  useWriteContract,
  useDecryptedValue,
  useTokenBalance,
  useTokenTransfer,
  useOperator,
  useBatchTransactions,
} from '@fhevm/sdk';
```

### Core Functions

```typescript
import {
  createFhevmInstance,
  FhevmDecryptionSignature,
} from '@fhevm/sdk';
```

### Storage

```typescript
import {
  GenericStringStorage,
  GenericStringInMemoryStorage,
} from '@fhevm/sdk';
```

### Types

```typescript
import type {
  FhevmConfig,
  FhevmChainConfig,
  ContractConfig,
  FhevmInstance,
  FhevmDecryptionSignatureType,
  DecryptedResults,
} from '@fhevm/sdk';
```

## Quick Reference

| Category | Items | Documentation |
|----------|-------|---------------|
| Configuration | createConfig, FhevmProvider | [Configuration API](../getting-started/configuration) |
| Hooks | useContract, useReadContract, useWriteContract, etc. | [Hooks API](./hooks.md) |
| Types | FhevmConfig, FhevmInstance, etc. | [Types API](./types.md) |
| Storage | GenericStringStorage | [Storage API](./storage.md) |
| Client | createFheClient | [Client API](./client.md) |

## TypeScript Support

The SDK is fully typed with TypeScript:

```typescript
import type { Abi } from 'abitype';
import { useReadContract } from '@fhevm/sdk';

type MyAbi = [...] as const;

const { data } = useReadContract<MyAbi>({
  abi: myAbi,
  functionName: 'getData', // Autocomplete works!
});
```

## Next Steps

- Review [Configuration API](../getting-started/configuration)
- Explore [Hooks API](./hooks.md)
- Check [Types Reference](./types.md)
