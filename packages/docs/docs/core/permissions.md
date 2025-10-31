---
sidebar_position: 5
---

# Permissions

Understanding the permission system for decryption in FHEVM.

## Overview

Decryption requires explicit user permission via EIP-712 signatures.

## Permission Structure

```typescript
type FhevmDecryptionSignature = {
  publicKey: string;           // Decryption public key
  privateKey: string;          // Decryption private key
  signature: string;           // EIP-712 signature
  contractAddresses: string[]; // Permitted contracts
  userAddress: string;         // User's address
  startTimestamp: number;      // Permission start time
  durationDays: number;        // Validity duration
};
```

## How It Works

### 1. Permission Request

When decryption is needed:

```typescript
const { decryptedData } = useReadContract({
  functionName: 'getBalance',
  decrypt: true, // Triggers permission request if needed
});
```

### 2. User Signs

User signs EIP-712 message:

```json
{
  "types": {
    "UserDecryptRequestVerification": [
      { "name": "publicKey", "type": "bytes" },
      { "name": "contractAddresses", "type": "address[]" },
      { "name": "start", "type": "uint256" },
      { "name": "duration", "type": "uint256" }
    ]
  },
  "domain": { ... },
  "message": {
    "publicKey": "0x...",
    "contractAddresses": ["0x123..."],
    "start": 1234567890,
    "duration": 365
  }
}
```

### 3. Permission Cached

Signature is cached and reused for:
- Same contracts
- Same user
- Within validity period

### 4. Decryption Allowed

SDK uses signature to decrypt values.

## Permission Scope

### Contract-Specific

Permissions are granted per contract:

```typescript
// Signature for contract A
const sig1 = await FhevmDecryptionSignature.loadOrSign(
  instance,
  ['0xContractA'],
  signer,
  storage
);

// Signature for contract B (requires new signature)
const sig2 = await FhevmDecryptionSignature.loadOrSign(
  instance,
  ['0xContractB'],
  signer,
  storage
);
```

### Multi-Contract

One signature can cover multiple contracts:

```typescript
const sig = await FhevmDecryptionSignature.loadOrSign(
  instance,
  ['0xContractA', '0xContractB', '0xContractC'],
  signer,
  storage
);
```

## Storage

### In-Memory Storage

Default storage (session-only):

```typescript
import { GenericStringInMemoryStorage } from '@fhevm/sdk';

const storage = new GenericStringInMemoryStorage();
```

### Custom Storage

Implement persistent storage:

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

## Validity

### Duration

Default: 365 days
Configurable when creating signature

### Expiration

Expired signatures are automatically:
- Detected during load
- Removed from cache
- Re-requested from user

### Checking Validity

```typescript
const isValid = signature.isValid();
// Returns false if current time > startTimestamp + durationDays
```

## Security Considerations

### User Control

Users decide:
- Which contracts to trust
- When to grant permission
- How long permission lasts

### Key Security

- Private keys generated client-side
- Never transmitted to blockchain
- Only used for decryption

### Signature Security

- Binds specific contracts
- Time-limited
- User address verified

## Best Practices

### 1. Minimize Contract Scope

Only request permission for necessary contracts:

```typescript
// Good - specific contracts
['0xTokenContract']

// Bad - unnecessary contracts
['0xTokenContract', '0xUnrelatedContract']
```

### 2. Handle Rejection

```typescript
try {
  const { decryptedValue } = useDecryptedValue({ handle, contractAddress });
} catch (error) {
  if (error.message.includes('SIGNATURE_ERROR')) {
    // User rejected permission
    alert('Decryption permission required');
  }
}
```

### 3. Inform Users

```typescript
function PermissionInfo() {
  return (
    <div className="permission-notice">
      This app needs permission to decrypt your balance.
      You'll be asked to sign once.
    </div>
  );
}
```

## Revocation

### Manual Revocation

Clear cached signatures:

```typescript
const { clearCache } = useFhevmContext();

function RevokeButton() {
  return (
    <button onClick={clearCache}>
      Revoke Decryption Permissions
    </button>
  );
}
```

### Automatic Revocation

Signatures are automatically revoked when:
- User disconnects wallet
- Chain changes
- Signature expires

## Notes

:::warning User Experience
Minimize signature requests by:
- Batching contract permissions
- Using longer durations
- Caching signatures properly
:::

:::tip Transparency
Always inform users why decryption permission is needed and which contracts will access their data.
:::

:::info Default Duration
The default 365-day duration balances security and user experience. Adjust based on your use case.
:::
