---
sidebar_position: 1
---

# Core Concepts

Understanding the core concepts behind the FHEVM SDK will help you build better encrypted applications.

## What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) enables computation on encrypted data without decryption. This allows you to:

- Keep sensitive data encrypted on-chain
- Perform calculations on encrypted values
- Maintain privacy while using blockchain transparency

## Key Components

### 1. FhevmInstance

The core encryption/decryption engine. Handles:
- Creating encrypted inputs
- Generating encryption keys
- Decrypting handles
- Managing encryption state

Learn more: [FhevmInstance](./client.md)

### 2. Encrypted Types

FHEVM supports various encrypted types:
- `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256` - Encrypted unsigned integers
- `ebool` - Encrypted boolean
- `eaddress` - Encrypted address

Learn more: [Encryption](./encryption.md)

### 3. Handles

Encrypted values are represented as "handles" (bytes32):
- Returned by contract read functions
- Passed to contract write functions
- Can be decrypted by authorized users

Learn more: [Decryption](./decryption.md)

### 4. Permissions

Decryption requires permission:
- User signs EIP-712 message
- Permission granted for specific contracts
- Valid for a duration (default: 365 days)

Learn more: [Permissions](./permissions.md)

## Data Flow

### Writing Encrypted Data

1. User provides plaintext value
2. SDK encrypts value locally
3. Encrypted handle + proof sent to contract
4. Contract stores encrypted value

```typescript
// User provides: 100
// SDK encrypts: handle + proof
// Contract receives: encrypted value
write({ functionName: 'transfer', args: [recipient, 100n] });
```

### Reading Encrypted Data

1. Contract returns encrypted handle
2. User signs decryption permission
3. SDK decrypts handle
4. Plaintext value displayed to user

```typescript
// Contract returns: 0x123abc...def (handle)
// SDK decrypts: 100
// User sees: 100
const { decryptedData } = useReadContract({ functionName: 'balanceOf', decrypt: true });
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Your React Application            │
├─────────────────────────────────────────────┤
│              FHEVM SDK Hooks                │
│  useReadContract, useWriteContract, etc.    │
├─────────────────────────────────────────────┤
│            FhevmProvider Context            │
│   - Configuration                           │
│   - FHEVM Instance                          │
│   - Decryption Cache                        │
├─────────────────────────────────────────────┤
│          FhevmInstance (WASM)               │
│   - Encryption Engine                       │
│   - Decryption Engine                       │
│   - Key Management                          │
├─────────────────────────────────────────────┤
│         Blockchain / Smart Contracts        │
│   - Encrypted Storage                       │
│   - FHE Operations                          │
└─────────────────────────────────────────────┘
```

## Modes of Operation

### Local Mode

- Encryption/decryption in browser
- Requires loading WASM module
- Better for privacy
- Slower initialization

```typescript
const config = createConfig({
  chains: [...],
  defaultMode: 'local',
});
```

### Remote Mode

- Encryption/decryption via relayer
- Faster initialization
- Requires trust in relayer
- Better for mobile

```typescript
const config = createConfig({
  chains: [...],
  defaultMode: 'remote',
  relayer: {
    baseUrl: 'https://relayer.zama.ai',
  },
});
```

## Security Considerations

### What's Encrypted

- Values stored in smart contracts
- Transaction amounts
- Sensitive user data

### What's Not Encrypted

- Transaction sender/receiver
- Function being called
- Transaction existence
- Gas costs

### Best Practices

1. **Minimize On-Chain Data**: Only store encrypted what needs to be on-chain
2. **Use Permissions Carefully**: Grant decryption permissions only to trusted contracts
3. **Validate Client-Side**: Validate inputs before encryption
4. **Handle Errors**: Encryption/decryption can fail - handle gracefully

## Performance

### Encryption

- Fast (milliseconds)
- Done locally in browser
- No network overhead

### Decryption

- Slower (seconds)
- Requires blockchain query
- Benefits from caching

### Optimization Tips

1. **Enable Caching**: Cache decrypted values
2. **Batch Operations**: Batch multiple operations when possible
3. **Lazy Decryption**: Only decrypt when needed
4. **Use Watch Sparingly**: Polling adds overhead

```typescript
const config = createConfig({
  cache: {
    enabled: true,
    ttl: 60000, // Cache for 1 minute
  },
});
```

## Next Steps

- Learn about [Encryption](./encryption.md)
- Understand [Decryption](./decryption.md)
- Explore [Permissions](./permissions.md)
- See [Examples](../examples/basic-usage.md)
