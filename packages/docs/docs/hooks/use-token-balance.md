---
sidebar_position: 6
---

# useTokenBalance

Hook to read token balances with automatic decryption for encrypted tokens.

## Usage

```typescript
import { useTokenBalance } from '@fhevm/sdk';

function TokenBalance({ address }: { address: string }) {
  const { balance, decimals, symbol, isLoading } = useTokenBalance({
    token: '0x123...',
    address,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      Balance: {balance} {symbol}
    </div>
  );
}
```

## Parameters

```typescript
type UseTokenBalanceParameters = {
  token: `0x${string}` | string;
  address?: `0x${string}` | string;
  watch?: boolean;
  enabled?: boolean;
};
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `token` | `0x${string} \| string` | - | Token contract address or name |
| `address` | `0x${string} \| string` | - | Account address |
| `watch` | `boolean` | `false` | Poll for updates |
| `enabled` | `boolean` | `true` | Enable fetching |

## Return Value

```typescript
type UseTokenBalanceReturnType = {
  balance: string | undefined;
  decimals: number | undefined;
  symbol: string | undefined;
  formatted: string | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};
```

## Examples

### Basic Usage

```typescript
function MyBalance() {
  const { address } = useAccount();
  const { balance, symbol } = useTokenBalance({
    token: '0x123...',
    address,
  });

  return <div>{balance} {symbol}</div>;
}
```

### Formatted Balance

```typescript
function FormattedBalance() {
  const { formatted, symbol } = useTokenBalance({
    token: '0x123...',
    address: userAddress,
  });

  return <div>{formatted} {symbol}</div>;
}
```

### Named Token

```typescript
function NamedTokenBalance() {
  const { balance } = useTokenBalance({
    token: 'myToken', // From config
    address: userAddress,
  });

  return <div>{balance}</div>;
}
```

## Related Hooks

- [useReadContract](./use-read-contract.md)
- [useTokenTransfer](./use-token-transfer.md)
