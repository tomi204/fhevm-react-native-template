---
sidebar_position: 9
---

# useBatchTransactions

Hook to batch multiple contract write operations into a single transaction flow.

## Usage

```typescript
import { useBatchTransactions } from '@fhevm/sdk';

function BatchOperations() {
  const { executeBatch, isLoading, isSuccess } = useBatchTransactions({
    address: '0x123...',
    abi: contractAbi,
  });

  const handleBatch = async () => {
    await executeBatch([
      { functionName: 'approve', args: [spender, amount] },
      { functionName: 'transfer', args: [recipient, amount] },
      { functionName: 'updateSettings', args: [settings] },
    ]);
  };

  return (
    <button onClick={handleBatch} disabled={isLoading}>
      Execute Batch
    </button>
  );
}
```

## Parameters

```typescript
type UseBatchTransactionsParameters = {
  address?: `0x${string}`;
  abi?: Abi;
  name?: string;
};
```

## Batch Operation

```typescript
type BatchOperation = {
  functionName: string;
  args?: any[];
  value?: bigint;
  gasLimit?: bigint;
};
```

## Return Value

```typescript
type UseBatchTransactionsReturnType = {
  executeBatch: (ops: BatchOperation[]) => Promise<TransactionReceipt[]>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  progress: number;
  total: number;
  reset: () => void;
};
```

## Examples

### Basic Batch

```typescript
function SimpleBatch() {
  const { executeBatch, progress, total } = useBatchTransactions({
    address: '0x123...',
    abi: contractAbi,
  });

  const handleBatch = async () => {
    await executeBatch([
      { functionName: 'operation1' },
      { functionName: 'operation2' },
      { functionName: 'operation3' },
    ]);
  };

  return (
    <div>
      <button onClick={handleBatch}>Execute {total} Operations</button>
      {progress > 0 && <div>Progress: {progress}/{total}</div>}
    </div>
  );
}
```

### With Error Handling

```typescript
function BatchWithErrors() {
  const { executeBatch, isError, error } = useBatchTransactions({
    address: '0x123...',
    abi: contractAbi,
  });

  const handleBatch = async () => {
    try {
      const receipts = await executeBatch([
        { functionName: 'op1' },
        { functionName: 'op2' },
      ]);
      console.log('All operations completed:', receipts);
    } catch (err) {
      console.error('Batch failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleBatch}>Execute Batch</button>
      {isError && <div className="error">{error?.message}</div>}
    </div>
  );
}
```

## Notes

:::tip Use Cases
Batch transactions are useful for:
- Multiple token approvals
- Setting up complex contract states
- Executing interdependent operations
:::

:::warning Sequential Execution
Operations are executed sequentially, not atomically. If one fails, subsequent operations won't execute.
:::
