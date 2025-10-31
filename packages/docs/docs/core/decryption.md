---
sidebar_position: 4
---

# Decryption

Learn how decryption works in the FHEVM SDK.

## Overview

Decryption converts encrypted handles back to plaintext values for authorized users.

## Automatic Decryption

The SDK automatically decrypts in `useReadContract`:

```typescript
const { decryptedData } = useReadContract({
  functionName: 'balanceOf',
  args: [userAddress],
  decrypt: true, // Enable auto-decryption
});

// decryptedData contains the plaintext value
```

## Decryption Process

1. **Handle Detection**: SDK detects encrypted handle (bytes32)
2. **Permission Check**: Checks for cached decryption signature
3. **Signature Request**: If needed, prompts user to sign
4. **Decryption**: Decrypts handle using signature
5. **Caching**: Caches result for future use

## Decryption Signature

### What It Is

An EIP-712 signature that grants permission to decrypt:

```typescript
{
  publicKey: "0x...",
  privateKey: "0x...",
  signature: "0x...",
  contractAddresses: ["0x123...", "0x456..."],
  userAddress: "0x789...",
  startTimestamp: 1234567890,
  durationDays: 365
}
```

### Lifecycle

1. **Generation**: User signs once per contract set
2. **Storage**: Cached in memory
3. **Reuse**: Used for all decryptions in session
4. **Expiration**: Valid for specified duration (default: 365 days)

## Manual Decryption

Use `useDecryptedValue` for specific handles:

```typescript
const { decryptedValue, isDecrypting } = useDecryptedValue({
  handle: '0x123abc...def',
  contractAddress: '0x456...',
});
```

## Caching

### Cache Behavior

Decrypted values are cached by:
- Chain ID
- User account
- Contract address
- Encrypted handle

### Configuration

```typescript
const config = createConfig({
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});
```

### Cache Invalidation

Cache is cleared when:
- TTL expires
- User disconnects
- Chain changes
- Manual clear via `clearCache()`

## Performance

### Without Cache

- Each decryption: 2-5 seconds
- Network requests to blockchain
- User experience degraded

### With Cache

- Cached reads: less than 1ms
- No network overhead
- Smooth user experience

## Error Handling

```typescript
const { decryptedValue, isError, error } = useDecryptedValue({
  handle,
  contractAddress,
});

if (isError) {
  console.error('Decryption failed:', error);
}
```

Common errors:
- `SIGNATURE_ERROR`: User rejected signature
- `DECRYPT_ERROR`: Decryption failed
- `NETWORK_ERROR`: Network issues

## Security

### What Users Control

- Which contracts can decrypt
- When to grant permission
- Permission duration

### What's Protected

- Decryption keys never leave client
- Signatures only valid for specified contracts
- Time-limited permissions

## Best Practices

### 1. Enable Caching

```typescript
const config = createConfig({
  cache: { enabled: true, ttl: 60000 },
});
```

### 2. Handle Loading States

```typescript
if (isDecrypting) return <Spinner />;
if (isError) return <Error />;
return <Display value={decryptedValue} />;
```

### 3. Batch Decryptions

Decrypt multiple values with one signature:

```typescript
// One signature works for all handles from same contracts
const balance1 = useDecryptedValue({ handle: h1, contractAddress });
const balance2 = useDecryptedValue({ handle: h2, contractAddress });
```

## Notes

:::warning User Permission
Decryption requires user signature. Always handle signature rejection gracefully.
:::

:::tip Cache TTL
Set cache TTL based on data update frequency. Financial data: 30-60s, Static data: 5-10 minutes.
:::

:::info Zero Hash
Zero hash (0x000...000) is treated as 0 and cached immediately without decryption.
:::
