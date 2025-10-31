---
sidebar_position: 1
---

# Storage Overview

The FHEVM SDK uses storage adapters to persist decryption signatures and other data across sessions.

## Storage Interface

All storage adapters implement the `GenericStringStorage` interface:

```typescript
interface GenericStringStorage {
  getItem(key: string): string | Promise<string | null> | null;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

## Built-in Storage Options

### 1. In-Memory Storage

Default storage adapter (session-only):

```typescript
import { GenericStringInMemoryStorage } from '@fhevm/sdk';

const storage = new GenericStringInMemoryStorage();
```

**Characteristics:**
- Data lost on page refresh
- Fast access
- No persistence
- Good for testing

### 2. LocalStorage (Web)

Persistent browser storage:

```typescript
class LocalStorageAdapter implements GenericStringStorage {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
```

### 3. AsyncStorage (React Native)

Persistent mobile storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AsyncStorageAdapter implements GenericStringStorage {
  async getItem(key: string) {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  }
}
```

## What is Stored

### Decryption Signatures

Most common use case:

```typescript
{
  key: "userAddress:contractHash",
  value: JSON.stringify({
    publicKey: "0x...",
    privateKey: "0x...",
    signature: "0x...",
    contractAddresses: ["0x123..."],
    startTimestamp: 1234567890,
    durationDays: 365,
    ...
  })
}
```

### Decryption Cache

Cached decrypted values (internal):

```typescript
{
  key: "chainId:account:contract:handle",
  value: JSON.stringify({
    value: "100",
    timestamp: 1234567890,
    chainId: 8009,
    account: "0x..."
  })
}
```

## Using Storage

### Default Usage

The SDK uses in-memory storage by default:

```typescript
import { useFHEDecrypt } from '@fhevm/sdk';

// Uses default in-memory storage
const { decrypt } = useFHEDecrypt({
  instance,
  ethersSigner,
  fhevmDecryptionSignatureStorage: new GenericStringInMemoryStorage(),
  chainId,
  requests,
});
```

### Custom Storage

Provide your own storage adapter:

```typescript
import { useFHEDecrypt } from '@fhevm/sdk';

const customStorage = new LocalStorageAdapter();

const { decrypt } = useFHEDecrypt({
  instance,
  ethersSigner,
  fhevmDecryptionSignatureStorage: customStorage,
  chainId,
  requests,
});
```

## Storage Keys

### Key Format

Keys follow a consistent pattern:

```
userAddress:contractHash
```

Example:
```
0x1234...5678:0xabcd...ef01
```

### Key Generation

Keys are generated based on:
- User address
- Contract addresses
- Public key (optional)

The SDK automatically manages key generation.

## Best Practices

### 1. Choose Appropriate Storage

| Use Case | Storage | Reason |
|----------|---------|--------|
| Production Web | LocalStorage | Persistent, no server needed |
| Production Mobile | AsyncStorage | Native mobile persistence |
| Development | InMemoryStorage | Fast, no cleanup needed |
| Testing | InMemoryStorage | Isolated test runs |

### 2. Handle Async Storage

```typescript
// Wait for async storage operations
const value = await storage.getItem(key);
if (value) {
  const signature = JSON.parse(value);
}
```

### 3. Error Handling

```typescript
try {
  await storage.setItem(key, value);
} catch (error) {
  console.error('Storage failed:', error);
  // Fallback to in-memory
}
```

### 4. Clear Sensitive Data

```typescript
// Clear on logout
const clearStorage = async () => {
  await storage.removeItem(signatureKey);
};
```

## Security Considerations

### What to Store

- Decryption signatures (safe to persist)
- Cached decrypted values (temporary)
- User preferences

### What NOT to Store

- Private keys used for transactions
- Wallet mnemonics
- Unencrypted sensitive data

### Storage Security

- LocalStorage is accessible to all scripts on the page
- Consider encrypted storage for sensitive data
- Clear storage on logout
- Implement data expiration

## Next Steps

- Learn about [IndexedDB Storage](./indexeddb.md)
- See [Custom Storage Implementation](./custom.md)
- Review [Core Concepts](../core/overview.md)
