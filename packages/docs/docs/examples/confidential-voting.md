---
sidebar_position: 3
---

# Confidential Voting

Build a confidential voting system where votes are encrypted and tallied securely.

## Voting Contract ABI

```typescript
export const votingAbi = [
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bytes32', internalType: 'externalEbool' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'getVoteCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      { name: 'yesVotes', type: 'bytes32' },
      { name: 'noVotes', type: 'bytes32' },
    ],
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voter', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;
```

## Voting Component

```typescript
import { useReadContract, useWriteContract } from '@fhevm/sdk';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function VotingProposal({ proposalId }: { proposalId: number }) {
  const { address } = useAccount();

  // Check if user has voted
  const { data: hasVoted, refetch: refetchVoteStatus } = useReadContract({
    address: '0x123...',
    abi: votingAbi,
    functionName: 'hasVoted',
    args: [proposalId, address],
  });

  // Vote hook
  const { write: submitVote, isLoading } = useWriteContract({
    address: '0x123...',
    abi: votingAbi,
  });

  const handleVote = async (support: boolean) => {
    try {
      await submitVote({
        functionName: 'vote',
        args: [proposalId, support], // Encrypted automatically
      });

      // Refetch vote status
      setTimeout(() => refetchVoteStatus(), 2000);
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  if (hasVoted) {
    return (
      <div className="voted">
        You have already voted on this proposal
      </div>
    );
  }

  return (
    <div className="voting-buttons">
      <button
        onClick={() => handleVote(true)}
        disabled={isLoading}
        className="vote-yes"
      >
        Vote Yes
      </button>

      <button
        onClick={() => handleVote(false)}
        disabled={isLoading}
        className="vote-no"
      >
        Vote No
      </button>
    </div>
  );
}
```

## Results Display (Admin Only)

```typescript
export function VotingResults({ proposalId }: { proposalId: number }) {
  const { address } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);

  // Only admin can decrypt results
  const { decryptedData: results, isDecrypting } = useReadContract({
    address: '0x123...',
    abi: votingAbi,
    functionName: 'getVoteCount',
    args: [proposalId],
    decrypt: true,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="results-locked">
        Results are encrypted and only visible to admin
      </div>
    );
  }

  if (isDecrypting) {
    return <div>Decrypting results...</div>;
  }

  const [yesVotes, noVotes] = results || [0n, 0n];

  return (
    <div className="results">
      <h3>Vote Results</h3>
      <div className="vote-count">
        <div className="yes-votes">
          Yes: {yesVotes.toString()}
        </div>
        <div className="no-votes">
          No: {noVotes.toString()}
        </div>
      </div>
      <div className="total">
        Total: {(BigInt(yesVotes) + BigInt(noVotes)).toString()}
      </div>
    </div>
  );
}
```

## Complete Voting Dashboard

```typescript
export function VotingDashboard() {
  const proposals = [
    { id: 1, title: 'Proposal 1: Increase Budget', description: '...' },
    { id: 2, title: 'Proposal 2: New Feature', description: '...' },
  ];

  return (
    <div className="voting-dashboard">
      <h1>Confidential Voting</h1>

      {proposals.map((proposal) => (
        <div key={proposal.id} className="proposal-card">
          <h2>{proposal.title}</h2>
          <p>{proposal.description}</p>

          <VotingProposal proposalId={proposal.id} />
          <VotingResults proposalId={proposal.id} />
        </div>
      ))}
    </div>
  );
}
```

## Key Features

1. **Private Votes**: Individual votes are encrypted
2. **Vote Tallying**: Results encrypted until reveal
3. **Double-Vote Prevention**: Contract tracks who has voted
4. **Admin-Only Results**: Only authorized parties can decrypt totals

## Privacy Properties

- Individual votes remain private
- Voters can't see how others voted
- Results only visible to admin
- Vote existence is public (who voted, not how)

## Security Considerations

1. **Voter Privacy**: Vote choice is encrypted
2. **Result Privacy**: Totals encrypted until authorized reveal
3. **Integrity**: Votes can't be changed after submission
4. **Transparency**: Vote existence is verifiable

## Next Steps

- See [React Native Example](./react-native.md)
- Review [Basic Usage](./basic-usage.md)
