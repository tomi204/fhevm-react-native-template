---
sidebar_position: 7
---

# useTokenTransfer

Hook to transfer tokens with automatic encryption for confidential transfers.

## Usage

```typescript
import { useTokenTransfer } from '@fhevm/sdk';

function TransferButton() {
  const { transfer, isLoading, isSuccess } = useTokenTransfer({
    address: '0x123...',
    abi: tokenAbi,
    isConfidential: true,
  });

  const handleTransfer = async () => {
    await transfer({
      to: '0x456...',
      amount: '100',
      decimals: 18,
    });
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      Transfer
    </button>
  );
}
```

## Parameters

```typescript
type UseTokenTransferParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  isConfidential?: boolean;
};
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `0x${string}` | - | Token contract address |
| `abi` | `Abi` | - | Token contract ABI |
| `name` | `string` | - | Token name from config |
| `isConfidential` | `boolean` | `false` | Use confidentialTransfer |

## Transfer Arguments

```typescript
type TransferArgs = {
  to: `0x${string}`;
  amount: string | bigint | number;
  decimals?: number;
};
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `to` | `0x${string}` | Recipient address |
| `amount` | `string \| bigint \| number` | Transfer amount |
| `decimals` | `number` | Token decimals for conversion |

## Return Value

```typescript
type UseTokenTransferReturnType = {
  transfer: (args: TransferArgs) => Promise<TransactionReceipt | undefined>;
  transferAsync: (args: TransferArgs) => Promise<TransactionReceipt | undefined>;
  data: TransactionReceipt | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};
```

## Examples

### Standard Transfer

```typescript
function StandardTransfer() {
  const { transfer, isLoading } = useTokenTransfer({
    address: '0x123...',
    abi: erc20Abi,
    isConfidential: false,
  });

  const handleTransfer = () => {
    transfer({
      to: recipientAddress,
      amount: '100',
      decimals: 18,
    });
  };

  return <button onClick={handleTransfer}>Transfer</button>;
}
```

### Confidential Transfer

```typescript
function ConfidentialTransfer() {
  const { transfer, isLoading } = useTokenTransfer({
    address: '0x123...',
    abi: encryptedERC20Abi,
    isConfidential: true, // Uses confidentialTransfer
  });

  const handleTransfer = () => {
    transfer({
      to: recipientAddress,
      amount: '100',
      decimals: 18,
    });
  };

  return <button onClick={handleTransfer}>Confidential Transfer</button>;
}
```

### With BigInt Amount

```typescript
function BigIntTransfer() {
  const { transfer } = useTokenTransfer({
    address: '0x123...',
    abi: tokenAbi,
    isConfidential: true,
  });

  const handleTransfer = () => {
    transfer({
      to: recipientAddress,
      amount: 100000000000000000000n, // Raw amount as bigint
      // No decimals needed when using bigint
    });
  };

  return <button onClick={handleTransfer}>Transfer</button>;
}
```

### Named Token

```typescript
function NamedTokenTransfer() {
  const { transfer } = useTokenTransfer({
    name: 'myToken', // From config
    isConfidential: true,
  });

  return (
    <button onClick={() => transfer({ to: '0x...', amount: '100', decimals: 18 })}>
      Transfer
    </button>
  );
}
```

## Function Selection

The hook automatically calls the correct function:

- `isConfidential: false` → calls `transfer(address to, uint256 amount)`
- `isConfidential: true` → calls `confidentialTransfer(address to, externalEuint64 amount, bytes inputProof)`

## Related Hooks

- [useWriteContract](./use-write-contract.md)
- [useTokenBalance](./use-token-balance.md)
