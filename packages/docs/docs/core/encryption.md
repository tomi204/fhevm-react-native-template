---
sidebar_position: 3
---

# Encryption

Learn how encryption works in the FHEVM SDK.

## Encrypted Types

FHEVM supports these encrypted types:

| Type | Description | Range |
|------|-------------|-------|
| `euint8` | 8-bit unsigned integer | 0 to 255 |
| `euint16` | 16-bit unsigned integer | 0 to 65,535 |
| `euint32` | 32-bit unsigned integer | 0 to 4,294,967,295 |
| `euint64` | 64-bit unsigned integer | 0 to 18,446,744,073,709,551,615 |
| `euint128` | 128-bit unsigned integer | Very large numbers |
| `euint256` | 256-bit unsigned integer | Very large numbers |
| `ebool` | Encrypted boolean | true/false |
| `eaddress` | Encrypted address | Ethereum address |

## External Types

For contract inputs, use `external*` types:

- `externalEuint8`, `externalEuint16`, etc.
- `externalEbool`
- `externalEaddress`

These require an `inputProof` parameter.

## Automatic Encryption

The SDK automatically encrypts based on ABI:

```solidity
// Contract function
function confidentialTransfer(
    address to,
    externalEuint64 amount, // Auto-encrypted
    bytes memory inputProof // Auto-generated
) external;
```

```typescript
// SDK usage - just provide plaintext
write({
  functionName: 'confidentialTransfer',
  args: [recipientAddress, 100n], // SDK encrypts 100n
});
```

## Manual Encryption

For advanced use cases:

```typescript
import { useFhevmContext } from '@fhevm/sdk';

function ManualEncryption() {
  const { instance, state } = useFhevmContext();

  const encryptValue = async (value: number) => {
    if (!instance || !state.signer) return;

    const userAddress = await state.signer.getAddress();
    const input = instance.createEncryptedInput(contractAddress, userAddress);

    input.add64(value);

    const encrypted = await input.encrypt();

    return {
      handle: encrypted.handles[0],
      inputProof: encrypted.inputProof,
    };
  };

  return <button onClick={() => encryptValue(100)}>Encrypt</button>;
}
```

## Encryption Process

1. **Input Creation**: Create encrypted input builder
2. **Value Addition**: Add values with appropriate methods
3. **Encryption**: Generate encrypted handles and proof
4. **Transmission**: Send to smart contract

## Best Practices

### Choose Appropriate Type

Use the smallest type that fits your data:

```typescript
// Good - fits in uint8
input.add8(100);

// Bad - unnecessary large type
input.add256(100);
```

### Batch Encryption

Encrypt multiple values together:

```typescript
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(amount1);
input.add64(amount2);
input.add8(flag);
const encrypted = await input.encrypt();
```

## Notes

:::tip Automatic Detection
The SDK automatically detects encrypted types from your ABI and handles encryption transparently.
:::

:::warning Type Mismatch
Ensure the encrypted type matches the contract's expected type to avoid errors.
:::
