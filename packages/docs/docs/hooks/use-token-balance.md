---
sidebar_position: 6
---

# useTokenBalance

Hook to read token balances with automatic formatting and decryption for confidential tokens.

## Usage

```typescript
import { useTokenBalance } from 'fhevm-sdk';

function TokenBalance({ address }: { address: string }) {
  const { balanceFormatted, isLoading, isDecrypting } = useTokenBalance({
    name: 'MyToken',
    account: address,
    isConfidential: true,
  });

  if (isLoading || isDecrypting) return <div>Loading...</div>;

  return <div>Balance: {balanceFormatted}</div>;
}
```

## Parameters

```typescript
type UseTokenBalanceParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  account?: `0x${string}`;
  isConfidential?: boolean;
  enabled?: boolean;
  watch?: boolean;
};
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `0x${string}` | - | Token contract address |
| `abi` | `Abi` | - | Token contract ABI |
| `name` | `string` | - | Token name from config |
| `account` | `0x${string}` | - | Account address to check |
| `isConfidential` | `boolean` | `false` | Use confidentialBalanceOf |
| `enabled` | `boolean` | `true` | Enable fetching |
| `watch` | `boolean` | `false` | Poll for updates |

## Return Value

```typescript
type UseTokenBalanceReturnType = {
  balance: string | undefined; // Formatted balance (e.g., "845.5137")
  balanceRaw: bigint | undefined; // Raw balance
  balanceFormatted: string | undefined; // Formatted with symbol (e.g., "845.5137 CGOV")
  decimals: number | undefined;
  symbol: string | undefined;
  encryptedBalance: string | undefined; // Only if isConfidential: true
  isLoading: boolean;
  isDecrypting: boolean; // Only if isConfidential: true
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};
```

## Examples

### Standard ERC-20 Balance

```typescript
function StandardBalance() {
  const { address } = useAccount();
  const { balanceFormatted, isLoading } = useTokenBalance({
    name: 'MyToken',
    account: address,
    isConfidential: false, // Standard ERC-20
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{balanceFormatted}</div>;
}
```

### Confidential Token Balance

```typescript
function ConfidentialBalance() {
  const { address } = useAccount();
  const {
    balanceFormatted,
    encryptedBalance,
    isLoading,
    isDecrypting,
  } = useTokenBalance({
    name: 'ConfidentialToken',
    account: address,
    isConfidential: true, // Uses confidentialBalanceOf
  });

  return (
    <div>
      <p>Encrypted: {encryptedBalance}</p>
      <p>Decrypted: {isDecrypting ? 'Decrypting...' : balanceFormatted}</p>
    </div>
  );
}
```

### With Address & ABI

```typescript
function DirectAddressBalance() {
  const { balance, symbol, decimals } = useTokenBalance({
    address: '0x123...', // Direct address
    abi: tokenAbi, // Direct ABI
    account: userAddress,
    isConfidential: false,
  });

  return <div>{balance} {symbol}</div>;
}
```

### Named Token from Config

```typescript
function NamedTokenBalance() {
  const { balanceFormatted, refetch } = useTokenBalance({
    name: 'MyToken', // From config
    account: userAddress,
    isConfidential: true,
  });

  return (
    <div>
      <p>{balanceFormatted}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### With Auto-Refresh

```typescript
function WatchedBalance() {
  const { balanceFormatted, isLoading } = useTokenBalance({
    name: 'MyToken',
    account: userAddress,
    isConfidential: true,
    watch: true, // Polls every 5 seconds
  });

  return <div>{isLoading ? 'Loading...' : balanceFormatted}</div>;
}
```

### Raw Balance

```typescript
function RawBalanceDisplay() {
  const { balanceRaw, decimals } = useTokenBalance({
    name: 'MyToken',
    account: userAddress,
  });

  // balanceRaw is a bigint
  return <div>Raw: {balanceRaw?.toString()}</div>;
}
```

## Function Selection

The hook automatically calls the correct function:

- `isConfidential: false` → calls `balanceOf(address account)`
- `isConfidential: true` → calls `confidentialBalanceOf(address account)` and auto-decrypts

## Automatic Formatting

The hook automatically:
1. Reads `decimals()` from the contract
2. Reads `symbol()` from the contract
3. Formats the balance with proper decimal places (truncated to 4 decimals)
4. Combines balance and symbol in `balanceFormatted`

## Related Hooks

- [useReadContract](./use-read-contract.md) - Generic contract reading
- [useTokenTransfer](./use-token-transfer.md) - Transfer tokens
- [useDecryptedValue](./use-decrypted-value.md) - Manual decryption
