---
sidebar_position: 2
---

# useContract

Hook to get an ethers Contract instance configured with the current signer or provider.

## Usage

```typescript
import { useContract } from '@fhevm/sdk';
import { myTokenAbi } from './abis';

function MyComponent() {
  const { contract, isReady } = useContract({
    address: '0x123...',
    abi: myTokenAbi,
    mode: 'write', // or 'read'
  });

  // Use contract directly
  const handleCall = async () => {
    if (contract) {
      const tx = await contract.myFunction();
      await tx.wait();
    }
  };

  return (
    <button onClick={handleCall} disabled={!isReady}>
      Call Function
    </button>
  );
}
```

## Parameters

### UseContractParameters

```typescript
type UseContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;  // Contract address
  abi?: TAbi;                // Contract ABI
  name?: string;             // Contract name from config
  mode?: 'read' | 'write';   // Default: 'read'
};
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | `0x${string}` | No* | Contract address |
| `abi` | `Abi` | No* | Contract ABI |
| `name` | `string` | No* | Contract name from configuration |
| `mode` | `'read' \| 'write'` | No | Connection mode (default: 'read') |

*Either `address` + `abi` OR `name` must be provided.

## Return Value

### UseContractReturnType

```typescript
type UseContractReturnType<TAbi extends Abi = Abi> = {
  contract: ethers.Contract | undefined;
  address: `0x${string}` | undefined;
  abi: TAbi | undefined;
  isReady: boolean;
};
```

| Property | Type | Description |
|----------|------|-------------|
| `contract` | `ethers.Contract \| undefined` | Ethers contract instance |
| `address` | `0x${string} \| undefined` | Resolved contract address |
| `abi` | `Abi \| undefined` | Resolved contract ABI |
| `isReady` | `boolean` | Whether contract is ready to use |

## Examples

### Basic Usage with Address and ABI

```typescript
import { useContract } from '@fhevm/sdk';

function DirectContract() {
  const { contract, isReady } = useContract({
    address: '0x1234567890123456789012345678901234567890',
    abi: myTokenAbi,
    mode: 'write',
  });

  const transfer = async () => {
    if (!contract) return;
    const tx = await contract.transfer(recipient, amount);
    await tx.wait();
  };

  return (
    <button onClick={transfer} disabled={!isReady}>
      Transfer
    </button>
  );
}
```

### Using Named Contracts

Reference contracts from configuration:

```typescript
// In your config
const config = createConfig({
  chains: [...],
  contracts: {
    myToken: {
      address: '0x123...',
      abi: myTokenAbi,
    },
  },
});

// In your component
function NamedContract() {
  const { contract, address } = useContract({
    name: 'myToken', // Reference by name
    mode: 'read',
  });

  return <div>Contract at: {address}</div>;
}
```

### Read vs Write Mode

```typescript
// Read mode - uses provider (no signer required)
const { contract: readContract } = useContract({
  address: '0x123...',
  abi: tokenAbi,
  mode: 'read', // Default
});

// Write mode - uses signer (user must be connected)
const { contract: writeContract, isReady } = useContract({
  address: '0x123...',
  abi: tokenAbi,
  mode: 'write',
});

// isReady is false if mode is 'write' and no signer is available
```

### Per-Chain Contracts

When using named contracts, the SDK automatically resolves per-chain configurations:

```typescript
const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Devnet',
      rpcUrl: 'https://devnet.zama.ai',
      contracts: {
        token: {
          address: '0x111...', // Devnet address
          abi: tokenAbi,
        },
      },
    },
    {
      id: 1,
      name: 'Mainnet',
      rpcUrl: 'https://mainnet.zama.ai',
      contracts: {
        token: {
          address: '0x222...', // Mainnet address
          abi: tokenAbi,
        },
      },
    },
  ],
});

// The SDK automatically uses the correct address based on connected chain
function TokenContract() {
  const { contract, address } = useContract({
    name: 'token',
  });

  // address will be 0x111... on devnet, 0x222... on mainnet
  return <div>Using contract: {address}</div>;
}
```

### Calling Contract Functions

```typescript
function ContractCaller() {
  const { contract, isReady } = useContract({
    address: '0x123...',
    abi: counterAbi,
    mode: 'write',
  });

  const increment = async () => {
    if (!contract) return;

    try {
      const tx = await contract.increment();
      console.log('Transaction hash:', tx.hash);

      const receipt = await tx.wait();
      console.log('Confirmed in block:', receipt.blockNumber);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={increment} disabled={!isReady}>
      Increment Counter
    </button>
  );
}
```

### Reading Contract State

```typescript
function ContractReader() {
  const { contract } = useContract({
    address: '0x123...',
    abi: counterAbi,
    mode: 'read',
  });

  const [count, setCount] = useState<bigint>();

  const fetchCount = async () => {
    if (!contract) return;
    const value = await contract.getCount();
    setCount(value);
  };

  useEffect(() => {
    fetchCount();
  }, [contract]);

  return <div>Count: {count?.toString()}</div>;
}
```

### With TypeScript Generics

```typescript
import type { Abi } from 'abitype';

type MyTokenAbi = Abi; // Your typed ABI

function TypedContract() {
  const { contract } = useContract<MyTokenAbi>({
    address: '0x123...',
    abi: myTokenAbi,
  });

  // contract is fully typed based on your ABI
  const handleTransfer = async () => {
    if (!contract) return;

    // TypeScript knows about all contract functions
    await contract.transfer(recipient, amount);
  };

  return <button onClick={handleTransfer}>Transfer</button>;
}
```

## Best Practices

### 1. Check isReady for Write Operations

Always check `isReady` before write operations:

```typescript
const { contract, isReady } = useContract({
  address: '0x123...',
  abi: tokenAbi,
  mode: 'write',
});

// isReady ensures signer is available
<button onClick={handleWrite} disabled={!isReady}>
  Write
</button>
```

### 2. Use Named Contracts for Multi-Chain Apps

Define contracts in configuration for easy multi-chain support:

```typescript
const { contract } = useContract({
  name: 'myToken', // Automatically uses correct address per chain
});
```

### 3. Prefer Higher-Level Hooks

For common operations, use specialized hooks:

- Use `useReadContract` instead of manually calling contract read functions
- Use `useWriteContract` instead of manually handling transactions
- Use `useTokenTransfer` for token transfers

```typescript
// Instead of this:
const { contract } = useContract({ ... });
const tx = await contract.transfer(to, amount);
await tx.wait();

// Use this:
const { write } = useWriteContract({ ... });
write({ functionName: 'transfer', args: [to, amount] });
```

## Related Hooks

- [useReadContract](./use-read-contract.md) - Higher-level hook for reading with auto-decryption
- [useWriteContract](./use-write-contract.md) - Higher-level hook for writing with auto-encryption
- [useTokenTransfer](./use-token-transfer.md) - Specialized hook for token transfers

## Notes

:::warning Provider Required
This hook requires `FhevmProvider` to be present in the component tree.
:::

:::tip Mode Selection
- Use `'read'` mode when you only need to read data (no signer required)
- Use `'write'` mode when you need to send transactions (signer required)
:::

:::note Contract Resolution
When using `name`, the SDK first checks per-chain contracts, then falls back to global contracts. This allows you to override global contracts on specific chains.
:::
