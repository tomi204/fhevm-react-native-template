---
sidebar_position: 4
---

# useWriteContract

Hook to write to smart contracts with automatic encryption of input parameters.

## Usage

```typescript
import { useWriteContract } from '@fhevm/sdk';

function TransferButton() {
  const { write, isLoading, isSuccess } = useWriteContract({
    address: '0x123...',
    abi: tokenAbi,
  });

  const handleTransfer = async () => {
    await write({
      functionName: 'confidentialTransfer',
      args: [recipientAddress, 100n],
    });
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? 'Transferring...' : 'Transfer'}
    </button>
  );
}
```

## Parameters

```typescript
type UseWriteContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
};
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `0x${string}` | Contract address |
| `abi` | `Abi` | Contract ABI |
| `name` | `string` | Contract name from config |

## Write Arguments

```typescript
type WriteContractArgs = {
  functionName: string;
  args?: any[];
  value?: bigint;
  gasLimit?: bigint;
};
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `functionName` | `string` | Function to call |
| `args` | `any[]` | Function arguments (auto-encrypted) |
| `value` | `bigint` | ETH value to send |
| `gasLimit` | `bigint` | Gas limit |

## Return Value

```typescript
type UseWriteContractReturnType = {
  write: (args: WriteContractArgs) => Promise<TransactionReceipt | undefined>;
  writeAsync: (args: WriteContractArgs) => Promise<TransactionReceipt | undefined>;
  data: TransactionReceipt | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};
```

| Property | Type | Description |
|----------|------|-------------|
| `write` | `Function` | Write function (catches errors) |
| `writeAsync` | `Function` | Write function (throws errors) |
| `data` | `TransactionReceipt \| undefined` | Transaction receipt |
| `isLoading` | `boolean` | Transaction in progress |
| `isSuccess` | `boolean` | Transaction succeeded |
| `isError` | `boolean` | Transaction failed |
| `error` | `Error \| null` | Error object |
| `reset` | `Function` | Reset state |

## Examples

### Basic Write

```typescript
function BasicWrite() {
  const { write, isLoading } = useWriteContract({
    address: '0x123...',
    abi: counterAbi,
  });

  return (
    <button
      onClick={() => write({ functionName: 'increment' })}
      disabled={isLoading}
    >
      Increment
    </button>
  );
}
```

### With Arguments

```typescript
function WithArgs() {
  const { write, isLoading } = useWriteContract({
    address: '0x123...',
    abi: tokenAbi,
  });

  const transfer = () => {
    write({
      functionName: 'transfer',
      args: [recipientAddress, 1000n],
    });
  };

  return (
    <button onClick={transfer} disabled={isLoading}>
      Transfer
    </button>
  );
}
```

### Encrypted Arguments

Arguments are automatically encrypted based on ABI:

```typescript
function EncryptedTransfer() {
  const { write } = useWriteContract({
    address: '0x123...',
    abi: encryptedTokenAbi, // Has externalEuint64 types
  });

  const transfer = () => {
    write({
      functionName: 'confidentialTransfer',
      // amount is automatically encrypted if ABI specifies externalEuint64
      args: [recipientAddress, 100n],
    });
  };

  return <button onClick={transfer}>Transfer</button>;
}
```

### With ETH Value

```typescript
function PayableFunction() {
  const { write } = useWriteContract({
    address: '0x123...',
    abi: contractAbi,
  });

  const deposit = () => {
    write({
      functionName: 'deposit',
      value: ethers.parseEther('1.0'), // Send 1 ETH
    });
  };

  return <button onClick={deposit}>Deposit 1 ETH</button>;
}
```

### Custom Gas Limit

```typescript
function CustomGas() {
  const { write } = useWriteContract({
    address: '0x123...',
    abi: contractAbi,
  });

  const execute = () => {
    write({
      functionName: 'complexOperation',
      gasLimit: 500000n, // Custom gas limit
    });
  };

  return <button onClick={execute}>Execute</button>;
}
```

### Async Write with Error Handling

```typescript
function AsyncWrite() {
  const { writeAsync, isLoading, error } = useWriteContract({
    address: '0x123...',
    abi: tokenAbi,
  });

  const handleTransfer = async () => {
    try {
      const receipt = await writeAsync({
        functionName: 'transfer',
        args: [recipientAddress, 100n],
      });

      console.log('Transaction confirmed:', receipt.transactionHash);
      alert('Transfer successful!');
    } catch (err) {
      console.error('Transfer failed:', err);
      alert('Transfer failed: ' + err.message);
    }
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={isLoading}>
        Transfer
      </button>
      {error && <div className="error">{error.message}</div>}
    </div>
  );
}
```

### Success Callback

```typescript
function WithSuccess() {
  const { write, isSuccess, data } = useWriteContract({
    address: '0x123...',
    abi: tokenAbi,
  });

  useEffect(() => {
    if (isSuccess && data) {
      console.log('Transaction hash:', data.transactionHash);
      console.log('Block number:', data.blockNumber);
      alert('Transaction successful!');
    }
  }, [isSuccess, data]);

  return (
    <button onClick={() => write({ functionName: 'transfer', args: [...] })}>
      Transfer
    </button>
  );
}
```

### Reset State

```typescript
function WithReset() {
  const { write, isSuccess, isError, reset } = useWriteContract({
    address: '0x123...',
    abi: tokenAbi,
  });

  return (
    <div>
      <button onClick={() => write({ functionName: 'transfer', args: [...] })}>
        Transfer
      </button>

      {isSuccess && (
        <div>
          Success! <button onClick={reset}>Reset</button>
        </div>
      )}

      {isError && (
        <div>
          Error! <button onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

### Named Contract

```typescript
function NamedContract() {
  const { write } = useWriteContract({
    name: 'myToken', // From config
  });

  return (
    <button onClick={() => write({ functionName: 'approve', args: [...] })}>
      Approve
    </button>
  );
}
```

### TypeScript Support

```typescript
import type { MyTokenAbi } from './types';

function TypedWrite() {
  const { write } = useWriteContract<MyTokenAbi>({
    address: '0x123...',
    abi: myTokenAbi,
  });

  const handleTransfer = () => {
    write({
      functionName: 'transfer', // Autocomplete works!
      args: [recipient, amount], // Type-checked!
    });
  };

  return <button onClick={handleTransfer}>Transfer</button>;
}
```

## Automatic Encryption

### Detected Types

The hook automatically encrypts arguments with these ABI types:

- `externalEuint8`, `externalEuint16`, `externalEuint32`, `externalEuint64`, `externalEuint128`, `externalEuint256`
- `externalEbool`
- `externalEaddress`
- `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`

### Example ABI

```typescript
const tokenAbi = [
  {
    name: 'confidentialTransfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'bytes32', internalType: 'externalEuint64' }, // Auto-encrypted
      { name: 'inputProof', type: 'bytes', internalType: 'bytes' }, // Auto-added
    ],
  },
] as const;
```

### Encryption Process

1. Detects encrypted types from ABI
2. Creates encrypted input
3. Encrypts specified values
4. Builds final arguments including handles and proof
5. Sends transaction

## Best Practices

### 1. Use writeAsync for Error Handling

```typescript
try {
  const receipt = await writeAsync({ ... });
  // Handle success
} catch (error) {
  // Handle error
}
```

### 2. Handle Loading States

```typescript
<button onClick={handleWrite} disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Submit'}
</button>
```

### 3. Reset After Success

```typescript
useEffect(() => {
  if (isSuccess) {
    reset(); // Reset for next operation
  }
}, [isSuccess, reset]);
```

### 4. Validate Before Writing

```typescript
const handleWrite = () => {
  if (!isValidInput()) {
    alert('Invalid input');
    return;
  }

  write({ functionName: 'submit', args: [...] });
};
```

## Related Hooks

- [useTokenTransfer](./use-token-transfer.md) - Specialized hook for token transfers
- [useContract](./use-contract.md) - Get contract instance
- [useBatchTransactions](./use-batch-transactions.md) - Batch multiple writes

## Notes

:::warning Provider Required
This hook requires `FhevmProvider` and a connected wallet with signer.
:::

:::tip Automatic Encryption
The hook automatically encrypts arguments based on ABI types. No manual encryption needed!
:::

:::note Gas Estimation
Gas is automatically estimated by ethers. You can override with the `gasLimit` parameter.
:::

:::info Transaction Confirmation
The hook waits for transaction confirmation before updating state. Use `data.transactionHash` to track pending transactions.
:::
