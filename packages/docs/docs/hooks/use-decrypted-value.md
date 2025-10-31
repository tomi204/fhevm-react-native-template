---
sidebar_position: 5
---

# useDecryptedValue

Hook to decrypt a specific encrypted handle from a contract.

## Usage

```typescript
import { useDecryptedValue } from '@fhevm/sdk';

function DecryptHandle({ handle }: { handle: string }) {
  const { decryptedValue, isDecrypting, error } = useDecryptedValue({
    handle,
    contractAddress: '0x123...',
  });

  if (isDecrypting) return <div>Decrypting...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Value: {decryptedValue?.toString()}</div>;
}
```

## Parameters

```typescript
type UseDecryptedValueParameters = {
  handle: string | undefined;
  contractAddress: `0x${string}` | undefined;
  enabled?: boolean;
};
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `handle` | `string \| undefined` | - | Encrypted handle to decrypt |
| `contractAddress` | `0x${string} \| undefined` | - | Contract address |
| `enabled` | `boolean` | `true` | Enable auto-decryption |

## Return Value

```typescript
type UseDecryptedValueReturnType = {
  decryptedValue: string | bigint | boolean | undefined;
  isDecrypting: boolean;
  isError: boolean;
  error: Error | null;
  decrypt: () => void;
};
```

| Property | Type | Description |
|----------|------|-------------|
| `decryptedValue` | `string \| bigint \| boolean \| undefined` | Decrypted value |
| `isDecrypting` | `boolean` | Decryption in progress |
| `isError` | `boolean` | Error occurred |
| `error` | `Error \| null` | Error object |
| `decrypt` | `() => void` | Manually trigger decryption |

## Examples

### Basic Decryption

```typescript
function BasicDecrypt() {
  const { decryptedValue, isDecrypting } = useDecryptedValue({
    handle: '0x123abc...',
    contractAddress: '0x456def...',
  });

  return (
    <div>
      {isDecrypting ? 'Decrypting...' : decryptedValue?.toString()}
    </div>
  );
}
```

### Manual Decryption

```typescript
function ManualDecrypt({ handle, contractAddress }: Props) {
  const { decryptedValue, decrypt, isDecrypting } = useDecryptedValue({
    handle,
    contractAddress,
    enabled: false, // Disable auto-decrypt
  });

  return (
    <div>
      <button onClick={decrypt} disabled={isDecrypting}>
        Decrypt
      </button>
      {decryptedValue && <div>Value: {decryptedValue.toString()}</div>}
    </div>
  );
}
```

### With Cache

```typescript
// Cache is automatically enabled based on config
const config = createConfig({
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});

function CachedDecrypt() {
  const { decryptedValue } = useDecryptedValue({
    handle: '0x123...',
    contractAddress: '0x456...',
  });

  // First call: decrypts from blockchain
  // Subsequent calls (within TTL): returns cached value
  return <div>{decryptedValue?.toString()}</div>;
}
```

### Error Handling

```typescript
function WithErrorHandling() {
  const { decryptedValue, isError, error } = useDecryptedValue({
    handle: '0x123...',
    contractAddress: '0x456...',
  });

  if (isError) {
    return <div className="error">Decryption failed: {error?.message}</div>;
  }

  return <div>Value: {decryptedValue?.toString()}</div>;
}
```

## Caching Behavior

### Cache Key

The cache key is based on:
- Chain ID
- User account
- Contract address
- Encrypted handle

### Cache Invalidation

Cache is invalidated when:
- TTL expires
- User account changes
- Chain changes
- Cache is manually cleared

### Zero Hash Handling

Zero hash (0x000...000) is treated as zero value and cached immediately without decryption.

## Related Hooks

- [useReadContract](./use-read-contract.md) - Read with auto-decryption
- [useTokenBalance](./use-token-balance.md) - Get token balance

## Notes

:::warning Provider Required
Requires `FhevmProvider` and connected wallet.
:::

:::tip Caching
Enable caching for better performance. Decryption operations can take several seconds.
:::

:::note Signature Request
First decryption prompts user to sign permission. This signature is cached for the session.
:::
