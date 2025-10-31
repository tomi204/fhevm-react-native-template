---
sidebar_position: 2
---

# Encrypted ERC20 Token

Complete example of an encrypted ERC20 token with confidential balances and transfers.

## Contract ABI

```typescript
export const encryptedERC20Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'bytes32' }], // Returns encrypted balance
  },
  {
    name: 'confidentialTransfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'bytes32', internalType: 'externalEuint64' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'bytes32', internalType: 'externalEuint64' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'bytes32' }], // Returns encrypted allowance
  },
] as const;
```

## Component Implementation

```typescript
import { useReadContract, useTokenTransfer, useAccount } from '@fhevm/sdk';
import { useState } from 'react';

export function EncryptedToken() {
  const { address } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // Read balance
  const {
    decryptedData: balance,
    isLoading,
    isDecrypting,
    refetch,
  } = useReadContract({
    address: '0x123...', // Token address
    abi: encryptedERC20Abi,
    functionName: 'balanceOf',
    args: [address],
    decrypt: true,
  });

  // Transfer hook
  const {
    transfer,
    isLoading: isTransferring,
    isSuccess,
    error,
  } = useTokenTransfer({
    address: '0x123...',
    abi: encryptedERC20Abi,
    isConfidential: true,
  });

  const handleTransfer = async () => {
    if (!recipient || !amount) return;

    try {
      await transfer({
        to: recipient as `0x${string}`,
        amount,
        decimals: 18,
      });

      // Refresh balance after transfer
      setTimeout(() => {
        refetch();
        setRecipient('');
        setAmount('');
      }, 2000);
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  return (
    <div className="encrypted-token">
      <h2>Encrypted Token</h2>

      <div className="balance-section">
        <h3>Your Balance</h3>
        {isLoading || isDecrypting ? (
          <div>Loading...</div>
        ) : (
          <div className="balance">
            {balance?.toString() || '0'} TOKENS
          </div>
        )}
        <button onClick={() => refetch()}>Refresh</button>
      </div>

      <div className="transfer-section">
        <h3>Confidential Transfer</h3>

        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={isTransferring}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isTransferring}
        />

        <button
          onClick={handleTransfer}
          disabled={!recipient || !amount || isTransferring}
        >
          {isTransferring ? 'Transferring...' : 'Transfer'}
        </button>

        {isSuccess && (
          <div className="success">Transfer successful!</div>
        )}

        {error && (
          <div className="error">Transfer failed: {error.message}</div>
        )}
      </div>
    </div>
  );
}
```

## With Allowances

```typescript
export function TokenWithAllowance() {
  const { address } = useAccount();
  const [spender, setSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');

  // Check allowance
  const { decryptedData: allowance } = useReadContract({
    address: '0x123...',
    abi: encryptedERC20Abi,
    functionName: 'allowance',
    args: [address, spender],
    decrypt: true,
    enabled: Boolean(spender),
  });

  // Approve hook
  const { write: approve, isLoading: isApproving } = useWriteContract({
    address: '0x123...',
    abi: encryptedERC20Abi,
  });

  const handleApprove = async () => {
    await approve({
      functionName: 'approve',
      args: [spender as `0x${string}`, BigInt(approveAmount)],
    });
  };

  return (
    <div className="allowance-section">
      <h3>Approve Spender</h3>

      <input
        type="text"
        placeholder="Spender address"
        value={spender}
        onChange={(e) => setSpender(e.target.value)}
      />

      {spender && (
        <div>Current Allowance: {allowance?.toString() || '0'}</div>
      )}

      <input
        type="number"
        placeholder="Approve amount"
        value={approveAmount}
        onChange={(e) => setApproveAmount(e.target.value)}
      />

      <button
        onClick={handleApprove}
        disabled={!spender || !approveAmount || isApproving}
      >
        {isApproving ? 'Approving...' : 'Approve'}
      </button>
    </div>
  );
}
```

## Complete Dashboard

```typescript
export function TokenDashboard() {
  const { address } = useAccount();

  const { decryptedData: balance } = useReadContract({
    address: '0x123...',
    abi: encryptedERC20Abi,
    functionName: 'balanceOf',
    args: [address],
    decrypt: true,
    watch: true, // Auto-refresh every 5s
  });

  return (
    <div className="dashboard">
      <header>
        <h1>Encrypted Token Dashboard</h1>
        <div className="address">Connected: {address}</div>
      </header>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Your Balance</div>
          <div className="stat-value">{balance?.toString() || '0'}</div>
        </div>
      </div>

      <div className="actions">
        <EncryptedToken />
        <TokenWithAllowance />
      </div>
    </div>
  );
}
```

## Key Features

1. **Confidential Balances**: Balances are encrypted on-chain
2. **Confidential Transfers**: Transfer amounts are encrypted
3. **Encrypted Allowances**: Approval amounts are encrypted
4. **Auto-refresh**: Watch mode keeps balance updated
5. **Error Handling**: Comprehensive error handling

## Security Considerations

1. **Balance Privacy**: Only token holder can decrypt their balance
2. **Transfer Privacy**: Transfer amounts are hidden from observers
3. **Allowance Privacy**: Approval amounts are encrypted
4. **Recipient Privacy**: Recipient addresses are public (blockchain limitation)

## Next Steps

- Learn about [Confidential Voting](./confidential-voting.md)
- Explore [React Native Integration](./react-native.md)
