---
sidebar_position: 2
---

# FhevmInstance

The FhevmInstance is the core encryption engine that powers the FHEVM SDK.

## Overview

FhevmInstance provides:
- Encryption of plaintext values
- Decryption of encrypted handles
- Key pair generation
- EIP-712 signature creation

## Creation

Instances are created automatically by the SDK:

```typescript
import { createFhevmInstance } from '@fhevm/sdk';

const instance = await createFhevmInstance({
  provider: window.ethereum,
  mockChains: { 31337: 'http://localhost:8545' },
  signal: abortController.signal,
});
```

## Methods

### createEncryptedInput

Create an encrypted input builder:

```typescript
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(100);
const encrypted = await input.encrypt();
```

### userDecrypt

Decrypt encrypted handles:

```typescript
const results = await instance.userDecrypt(
  [{ handle, contractAddress }],
  privateKey,
  publicKey,
  signature,
  contractAddresses,
  userAddress,
  startTimestamp,
  durationDays
);

const decryptedValue = results[handle];
```

### generateKeypair

Generate encryption key pair:

```typescript
const { publicKey, privateKey } = instance.generateKeypair();
```

### createEIP712

Create EIP-712 typed data for signatures:

```typescript
const eip712 = instance.createEIP712(
  publicKey,
  contractAddresses,
  startTimestamp,
  durationDays
);
```

## Usage in Hooks

The SDK hooks automatically use the FhevmInstance:

```typescript
function MyComponent() {
  const { instance } = useFhevmContext();

  // instance is available for custom operations
  if (instance) {
    // Manual encryption if needed
  }
}
```

## Notes

:::warning Initialization Time
Creating an FhevmInstance can take several seconds as it loads the WASM module.
:::

:::tip Caching
The SDK automatically manages instance lifecycle and caching.
:::
