---
sidebar_position: 8
---

# useOperator

Hook to manage operator permissions for encrypted token operations.

## Usage

```typescript
import { useOperator } from '@fhevm/sdk';

function OperatorManager() {
  const { approve, revoke, isApproved, isLoading } = useOperator({
    token: '0x123...',
    operator: '0x456...',
  });

  return (
    <div>
      <div>Approved: {isApproved ? 'Yes' : 'No'}</div>
      <button onClick={approve} disabled={isLoading}>
        Approve Operator
      </button>
      <button onClick={revoke} disabled={isLoading}>
        Revoke Operator
      </button>
    </div>
  );
}
```

## Parameters

```typescript
type UseOperatorParameters = {
  token: `0x${string}` | string;
  operator: `0x${string}`;
  enabled?: boolean;
};
```

## Return Value

```typescript
type UseOperatorReturnType = {
  isApproved: boolean | undefined;
  approve: () => Promise<void>;
  revoke: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};
```

## Examples

### Basic Usage

```typescript
function OperatorApproval() {
  const { approve, isLoading } = useOperator({
    token: '0x123...',
    operator: spenderAddress,
  });

  return (
    <button onClick={approve} disabled={isLoading}>
      Approve Operator
    </button>
  );
}
```

### Check and Update

```typescript
function OperatorStatus() {
  const { isApproved, approve, revoke } = useOperator({
    token: '0x123...',
    operator: operatorAddress,
  });

  return (
    <div>
      {isApproved ? (
        <button onClick={revoke}>Revoke</button>
      ) : (
        <button onClick={approve}>Approve</button>
      )}
    </div>
  );
}
```

## Notes

:::note ERC7984 Standard
This hook works with contracts implementing the ERC7984 operator standard for encrypted tokens.
:::
