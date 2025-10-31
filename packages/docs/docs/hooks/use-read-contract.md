---
sidebar_position: 3
---

# useReadContract

Hook to read from smart contracts with automatic decryption of encrypted return values.

## Usage

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

## Parameters

```typescript
type UseReadContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  functionName: string;
  args?: any[];
  enabled?: boolean;
  watch?: boolean;
  decrypt?: boolean;
};
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `0x${string}` | - | Contract address |
| `abi` | `Abi` | - | Contract ABI |
| `name` | `string` | - | Contract name from config |
| `functionName` | `string` | Required | Function to call |
| `args` | `any[]` | `[]` | Function arguments |
| `enabled` | `boolean` | `true` | Enable/disable fetching |
| `watch` | `boolean` | `false` | Poll for updates every 5s |
| `decrypt` | `boolean` | `true` | Auto-decrypt encrypted values |

## Return Value

```typescript
type UseReadContractReturnType = {
  data: any;
  encryptedData: string | undefined;
  decryptedData: string | bigint | boolean | undefined;
  isLoading: boolean;
  isDecrypting: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};
```

| Property | Type | Description |
|----------|------|-------------|
| `data` | `any` | Raw data from contract |
| `encryptedData` | `string \| undefined` | Encrypted handle if applicable |
| `decryptedData` | `string \| bigint \| boolean \| undefined` | Decrypted value |
| `isLoading` | `boolean` | Initial loading state |
| `isDecrypting` | `boolean` | Decryption in progress |
| `isError` | `boolean` | Error occurred |
| `error` | `Error \| null` | Error object |
| `refetch` | `() => Promise<void>` | Manually refetch data |

## Examples

### Basic Reading

```typescript
function TokenName() {
  const { data, isLoading } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'name',
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>Token: {data}</div>;
}
```

### Reading with Decryption

```typescript
function EncryptedBalance() {
  const { decryptedData, isLoading, isDecrypting } = useReadContract({
    address: '0x123...',
    abi: encryptedTokenAbi,
    functionName: 'balanceOf',
    args: [userAddress],
    decrypt: true, // Enable auto-decryption
  });

  if (isLoading) return <div>Loading...</div>;
  if (isDecrypting) return <div>Decrypting...</div>;

  return <div>Balance: {decryptedData?.toString()}</div>;
}
```

### Using Named Contracts

```typescript
function NamedContractRead() {
  const { data } = useReadContract({
    name: 'myToken', // From config
    functionName: 'totalSupply',
  });

  return <div>Total Supply: {data?.toString()}</div>;
}
```

### With Arguments

```typescript
function AllowanceChecker({ owner, spender }: Props) {
  const { data } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'allowance',
    args: [owner, spender],
  });

  return <div>Allowance: {data?.toString()}</div>;
}
```

### Conditional Fetching

```typescript
function ConditionalRead({ shouldFetch }: { shouldFetch: boolean }) {
  const { data, isLoading } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'getData',
    enabled: shouldFetch, // Only fetch when enabled
  });

  if (!shouldFetch) return <div>Disabled</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Data: {data}</div>;
}
```

### Watching for Changes

```typescript
function LiveBalance() {
  const { decryptedData, isDecrypting } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: [userAddress],
    watch: true, // Poll every 5 seconds
    decrypt: true,
  });

  return (
    <div>
      Balance: {decryptedData?.toString()}
      {isDecrypting && ' (updating...)'}
    </div>
  );
}
```

### Manual Refetch

```typescript
function ManualRefetch() {
  const { data, refetch, isLoading } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'getData',
  });

  return (
    <div>
      <div>Data: {data}</div>
      <button onClick={() => refetch()} disabled={isLoading}>
        Refresh
      </button>
    </div>
  );
}
```

### Error Handling

```typescript
function WithErrorHandling() {
  const { data, error, isError, isLoading } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'getData',
  });

  if (isLoading) return <div>Loading...</div>;

  if (isError) {
    return (
      <div className="error">
        Error: {error?.message}
      </div>
    );
  }

  return <div>Data: {data}</div>;
}
```

### Both Encrypted and Raw Data

```typescript
function BothValues() {
  const { encryptedData, decryptedData, isDecrypting } = useReadContract({
    address: '0x123...',
    abi: tokenAbi,
    functionName: 'getBalance',
    decrypt: true,
  });

  return (
    <div>
      <div>Encrypted Handle: {encryptedData}</div>
      <div>
        Decrypted Value:{' '}
        {isDecrypting ? 'Decrypting...' : decryptedData?.toString()}
      </div>
    </div>
  );
}
```

### TypeScript Support

```typescript
import type { MyTokenAbi } from './types';

function TypedRead() {
  const { data } = useReadContract<MyTokenAbi>({
    address: '0x123...',
    abi: myTokenAbi,
    functionName: 'balanceOf', // Autocomplete works!
    args: [userAddress], // Type-checked!
  });

  return <div>{data?.toString()}</div>;
}
```

## Decryption Behavior

### Automatic Detection

The hook automatically detects encrypted return values:

- Checks if return value is a bytes32 handle (0x followed by 64 hex chars)
- Excludes zero hash (0x000...000)
- Only attempts decryption if `decrypt: true`

### Decryption Process

1. Detects encrypted handle
2. Requests user signature (once per session)
3. Decrypts using FHEVM instance
4. Caches result
5. Returns decrypted value

### Cache Integration

Decrypted values are automatically cached based on:
- Chain ID
- User account
- Contract address
- Encrypted handle

Cache TTL is configured in `FhevmConfig`.

## Best Practices

### 1. Enable Decryption for Encrypted Data

```typescript
const { decryptedData } = useReadContract({
  functionName: 'getBalance',
  decrypt: true, // Important for encrypted values
});
```

### 2. Use Conditional Fetching

```typescript
const { data } = useReadContract({
  functionName: 'getData',
  enabled: Boolean(address), // Only fetch when address exists
});
```

### 3. Handle Loading States

```typescript
if (isLoading) return <Spinner />;
if (isDecrypting) return <span>Decrypting...</span>;
if (isError) return <Error message={error.message} />;
return <Display data={decryptedData} />;
```

### 4. Use Watch Sparingly

```typescript
// Only use watch for data that changes frequently
const { data } = useReadContract({
  functionName: 'getLivePrice',
  watch: true, // Polls every 5 seconds
});
```

## Performance Tips

### Caching

Enable caching in configuration:

```typescript
const config = createConfig({
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});
```

### Disable Unused Features

```typescript
const { data } = useReadContract({
  functionName: 'getData',
  decrypt: false, // Disable if data isn't encrypted
  watch: false,   // Disable polling if not needed
});
```

## Related Hooks

- [useContract](./use-contract.md) - Get contract instance
- [useDecryptedValue](./use-decrypted-value.md) - Decrypt specific handles
- [useTokenBalance](./use-token-balance.md) - Specialized hook for token balances

## Notes

:::warning Provider Required
This hook requires `FhevmProvider` to be present in the component tree.
:::

:::tip Automatic Decryption
The hook automatically detects encrypted handles and decrypts them when `decrypt: true`. No manual intervention needed!
:::

:::note Signature Request
The first decryption operation will prompt the user to sign a decryption permission. This signature is cached for future operations.
:::

:::info Polling Interval
When `watch: true`, the hook polls every 5 seconds. This interval is not configurable in the current version.
:::
