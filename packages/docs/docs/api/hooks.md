---
sidebar_position: 4
---

# Hooks API Reference

Complete API reference for all React hooks.

For detailed documentation and examples, see the individual hook pages:

## Contract Hooks

### useContract

Get ethers Contract instance.

[Full Documentation](../hooks/use-contract.md)

```typescript
function useContract<TAbi extends Abi = Abi>(
  parameters: UseContractParameters<TAbi>
): UseContractReturnType<TAbi>
```

### useReadContract

Read from contracts with auto-decryption.

[Full Documentation](../hooks/use-read-contract.md)

```typescript
function useReadContract<TAbi extends Abi = Abi>(
  parameters: UseReadContractParameters<TAbi>
): UseReadContractReturnType
```

### useWriteContract

Write to contracts with auto-encryption.

[Full Documentation](../hooks/use-write-contract.md)

```typescript
function useWriteContract<TAbi extends Abi = Abi>(
  parameters: UseWriteContractParameters<TAbi>
): UseWriteContractReturnType
```

### useDecryptedValue

Decrypt specific encrypted handles.

[Full Documentation](../hooks/use-decrypted-value.md)

```typescript
function useDecryptedValue(
  parameters: UseDecryptedValueParameters
): UseDecryptedValueReturnType
```

## Token Hooks

### useTokenBalance

Read token balances.

[Full Documentation](../hooks/use-token-balance.md)

```typescript
function useTokenBalance(
  parameters: UseTokenBalanceParameters
): UseTokenBalanceReturnType
```

### useTokenTransfer

Transfer tokens (standard or confidential).

[Full Documentation](../hooks/use-token-transfer.md)

```typescript
function useTokenTransfer<TAbi extends Abi = Abi>(
  parameters: UseTokenTransferParameters<TAbi>
): UseTokenTransferReturnType
```

## Utility Hooks

### useOperator

Manage operator permissions.

[Full Documentation](../hooks/use-operator.md)

```typescript
function useOperator(
  parameters: UseOperatorParameters
): UseOperatorReturnType
```

### useBatchTransactions

Batch multiple transactions.

[Full Documentation](../hooks/use-batch-transactions.md)

```typescript
function useBatchTransactions(
  parameters: UseBatchTransactionsParameters
): UseBatchTransactionsReturnType
```

## Context Hooks

### useFhevmContext

Access FHEVM provider context.

```typescript
function useFhevmContext(): FhevmContextValue

type FhevmContextValue = {
  config: FhevmConfig;
  state: FhevmState;
  instance: FhevmInstance | undefined;
  decryptCache: DecryptCacheStore;
  updateState: (updates: Partial<FhevmState>) => void;
  clearCache: () => void;
};
```

Example:

```typescript
import { useFhevmContext } from '@fhevm/sdk';

function MyComponent() {
  const { instance, state, clearCache } = useFhevmContext();

  return (
    <div>
      <div>Chain: {state.chainId}</div>
      <div>Account: {state.account}</div>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  );
}
```

### useSyncWithWallet

Sync FHEVM state with wallet.

```typescript
function useSyncWithWallet(params: {
  chainId?: number;
  address?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
}): void
```

Example:

```typescript
import { useSyncWithWallet } from '@fhevm/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useMemo } from 'react';

function WalletSync() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const ethersSigner = useMemo(() => {
    if (!walletClient) return undefined;
    const provider = new BrowserProvider(walletClient);
    return provider.getSigner();
  }, [walletClient]);

  useSyncWithWallet({
    address,
    chainId,
    signer: ethersSigner,
  });

  return null;
}
```

## Lower-Level Hooks

### useFhevm

Core FHEVM instance management (from react/useFhevm.tsx).

```typescript
function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
}
```

### useFHEEncryption

Encryption utilities (from react/useFHEEncryption.ts).

```typescript
function useFHEEncryption(params: {
  instance: FhevmInstance | undefined;
  ethersSigner: ethers.Signer | undefined;
  contractAddress: `0x${string}` | undefined;
}): {
  canEncrypt: boolean;
  encryptWith: (buildFn: (builder: RelayerEncryptedInput) => void) => Promise<EncryptResult | undefined>;
}
```

### useFHEDecrypt

Decryption utilities (from react/useFHEDecrypt.ts).

```typescript
function useFHEDecrypt(params: {
  instance: FhevmInstance | undefined;
  ethersSigner: ethers.Signer | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
  requests: readonly FHEDecryptRequest[] | undefined;
}): {
  canDecrypt: boolean;
  decrypt: () => void;
  isDecrypting: boolean;
  message: string;
  results: Record<string, string | bigint | boolean>;
  error: string | null;
  setMessage: (message: string) => void;
  setError: (error: string | null) => void;
}
```

## Hook Patterns

### Combining Hooks

```typescript
function TokenManager() {
  const { address } = useAccount();

  // Read balance
  const { decryptedData: balance } = useReadContract({
    name: 'token',
    functionName: 'balanceOf',
    args: [address],
    decrypt: true,
  });

  // Transfer hook
  const { transfer, isLoading } = useTokenTransfer({
    name: 'token',
    isConfidential: true,
  });

  return (
    <div>
      <div>Balance: {balance?.toString()}</div>
      <button onClick={() => transfer({ to: '0x...', amount: '100', decimals: 18 })}>
        Transfer
      </button>
    </div>
  );
}
```

### Conditional Execution

```typescript
function ConditionalRead({ enabled }: { enabled: boolean }) {
  const { data } = useReadContract({
    name: 'contract',
    functionName: 'getData',
    enabled, // Only fetch when enabled
  });

  return <div>{data}</div>;
}
```

### Error Handling

```typescript
function WithErrors() {
  const { data, error, isError } = useReadContract({
    name: 'contract',
    functionName: 'getData',
  });

  if (isError) {
    return <div className="error">{error?.message}</div>;
  }

  return <div>{data}</div>;
}
```

## Next Steps

- Review [Individual Hook Documentation](../hooks/overview.md)
- Check [Types Reference](./types.md)
- Explore [Examples](../examples/basic-usage.md)
