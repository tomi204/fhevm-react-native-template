# FHEVM SDK Examples

Complete examples showing how to use the FHEVM SDK for common use cases.

## Example 1: Basic Encrypted Counter

The simplest possible example - an encrypted counter.

```typescript
import { useReadContract, useWriteContract } from "@fhevm-sdk";

function Counter() {
  // Read the encrypted count and auto-decrypt
  const { decryptedData: count, isLoading } = useReadContract({
    name: "Counter",
    functionName: "getCount",
    watch: true, // Auto-refresh
  });

  // Write to increment
  const { write, isLoading: isIncrementing } = useWriteContract({
    name: "Counter",
  });

  return (
    <div>
      <h1>Count: {count?.toString() || "0"}</h1>
      <button
        onClick={() => write({ functionName: "increment", args: [1] })}
        disabled={isIncrementing}
      >
        Increment
      </button>
    </div>
  );
}
```

## Example 2: Encrypted Token Balance

Show user's encrypted token balance.

```typescript
import { useReadContract } from "@fhevm-sdk";
import { useAccount } from "wagmi";

function TokenBalance() {
  const { address } = useAccount();

  const { decryptedData: balance, isDecrypting } = useReadContract({
    name: "EncryptedToken",
    functionName: "balanceOf",
    args: [address],
    enabled: Boolean(address),
  });

  return (
    <div className="balance-card">
      <h3>Your Balance</h3>
      {isDecrypting ? (
        <span>Decrypting...</span>
      ) : (
        <span className="amount">{balance?.toString() || "0"} tokens</span>
      )}
    </div>
  );
}
```

## Example 3: Encrypted Token Transfer

Transfer encrypted tokens with automatic encryption.

```typescript
import { useState } from "react";
import { useWriteContract } from "@fhevm-sdk";

function TokenTransfer() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const {
    write,
    isLoading,
    isSuccess,
    error,
  } = useWriteContract({
    name: "EncryptedToken",
  });

  const handleTransfer = async () => {
    await write({
      functionName: "transfer",
      args: [
        recipient,
        parseInt(amount), // SDK automatically encrypts this!
      ],
    });
  };

  return (
    <div className="transfer-form">
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={isLoading}>
        {isLoading ? "Transferring..." : "Transfer"}
      </button>
      {isSuccess && <p className="success">Transfer successful!</p>}
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

## Example 4: Batch Multiple Transfers

Send tokens to multiple recipients in one batch.

```typescript
import { useBatchTransactions, useContract } from "@fhevm-sdk";

function BatchTransfer() {
  const { contract } = useContract({ name: "EncryptedToken" });
  const {
    addToBatch,
    executeBatch,
    batch,
    isExecuting,
    progress,
    results,
  } = useBatchTransactions();

  const recipients = [
    { address: "0x123...", amount: 100 },
    { address: "0x456...", amount: 200 },
    { address: "0x789...", amount: 300 },
  ];

  const handleBatchTransfer = () => {
    recipients.forEach((recipient, index) => {
      if (contract) {
        addToBatch({
          id: `transfer-${index}`,
          contract,
          functionName: "transfer",
          args: [recipient.address, recipient.amount],
        });
      }
    });
  };

  return (
    <div>
      <button onClick={handleBatchTransfer}>
        Add {recipients.length} transfers to batch
      </button>

      {batch.length > 0 && (
        <>
          <p>Batch size: {batch.length} transactions</p>
          <button onClick={executeBatch} disabled={isExecuting}>
            Execute Batch
          </button>
          {isExecuting && (
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }} />
              <span>{progress.toFixed(0)}%</span>
            </div>
          )}
        </>
      )}

      {results.length > 0 && (
        <div className="results">
          <h3>Results:</h3>
          {results.map((result, index) => (
            <div key={result.id}>
              Transfer {index + 1}:{" "}
              {result.success ? "✅ Success" : "❌ Failed"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Example 5: DAO with Encrypted Voting

Anonymous voting with encrypted vote counts.

```typescript
import { useReadContract, useWriteContract, useOperator } from "@fhevm-sdk";
import { useAccount } from "wagmi";

function DAOProposal({ proposalId }: { proposalId: number }) {
  const { address } = useAccount();

  // Ensure user is set as operator for the DAO
  const { isOperator, ensureOperator } = useOperator({
    name: "EncryptedDAO",
    operatorAddress: address as `0x${string}`,
    autoSetup: true, // Automatically setup if needed
  });

  // Read encrypted vote counts
  const { decryptedData: yesVotes } = useReadContract({
    name: "EncryptedDAO",
    functionName: "getYesVotes",
    args: [proposalId],
    enabled: isOperator, // Only decrypt if operator
  });

  const { decryptedData: noVotes } = useReadContract({
    name: "EncryptedDAO",
    functionName: "getNoVotes",
    args: [proposalId],
    enabled: isOperator,
  });

  // Cast vote
  const { write, isLoading } = useWriteContract({
    name: "EncryptedDAO",
  });

  const castVote = async (support: boolean) => {
    await write({
      functionName: "vote",
      args: [proposalId, support ? 1 : 0], // Auto-encrypted
    });
  };

  return (
    <div className="proposal">
      <h3>Proposal #{proposalId}</h3>

      {isOperator && (
        <div className="vote-counts">
          <p>Yes votes: {yesVotes?.toString() || "?"}</p>
          <p>No votes: {noVotes?.toString() || "?"}</p>
        </div>
      )}

      <div className="vote-buttons">
        <button onClick={() => castVote(true)} disabled={isLoading}>
          Vote Yes
        </button>
        <button onClick={() => castVote(false)} disabled={isLoading}>
          Vote No
        </button>
      </div>
    </div>
  );
}
```

## Example 6: Encrypted Auction

Sealed bid auction with encrypted bids.

```typescript
import { useState } from "react";
import { useReadContract, useWriteContract, useDecryptedValue } from "@fhevm-sdk";

function Auction({ auctionId }: { auctionId: number }) {
  const [bidAmount, setBidAmount] = useState("");

  // Read auction info
  const { data: auctionData } = useReadContract({
    name: "EncryptedAuction",
    functionName: "getAuction",
    args: [auctionId],
  });

  // Read and decrypt highest bid (only after auction ends)
  const { decryptedData: highestBid } = useDecryptedValue({
    handle: auctionData?.highestBidHandle,
    contractAddress: auctionData?.contractAddress,
    enabled: auctionData?.ended,
  });

  // Place bid
  const { write, isLoading } = useWriteContract({
    name: "EncryptedAuction",
  });

  const placeBid = async () => {
    await write({
      functionName: "placeBid",
      args: [auctionId, parseInt(bidAmount)], // Auto-encrypted
    });
  };

  return (
    <div className="auction">
      <h2>Auction #{auctionId}</h2>

      {auctionData?.ended ? (
        <div className="results">
          <p>Auction Ended</p>
          <p>Winning Bid: {highestBid?.toString()}</p>
        </div>
      ) : (
        <div className="bid-form">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Your bid amount"
          />
          <button onClick={placeBid} disabled={isLoading}>
            {isLoading ? "Placing bid..." : "Place Bid"}
          </button>
          <p className="note">Your bid is encrypted and private</p>
        </div>
      )}
    </div>
  );
}
```

## Example 7: Complete App Setup

Full app setup with all providers and configuration.

```typescript
// config/fhevm.ts
import { createConfig, registerContract } from "@fhevm-sdk";
import { TokenABI, DAOABI, AuctionABI } from "./abis";

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 8009,
      name: "Zama Devnet",
      rpcUrl: "https://devnet.zama.ai",
    },
  ],
  contracts: {
    EncryptedToken: {
      address: "0x...",
      abi: TokenABI,
    },
    EncryptedDAO: {
      address: "0x...",
      abi: DAOABI,
    },
    EncryptedAuction: {
      address: "0x...",
      abi: AuctionABI,
    },
  },
  defaultMode: "local",
  cache: {
    enabled: true,
    ttl: 60000,
  },
});

// Register contracts
registerContract("EncryptedToken", {
  address: "0x..." as `0x${string}`,
  abi: TokenABI,
});

// app.tsx
import { WagmiProvider } from "wagmi";
import { FhevmProvider, FhevmWagmiSync } from "@fhevm-sdk";
import { QueryClientProvider } from "@tanstack/react-query";
import { fhevmConfig } from "./config/fhevm";
import { wagmiConfig } from "./config/wagmi";
import { queryClient } from "./config/query";

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FhevmProvider config={fhevmConfig}>
          <FhevmWagmiSync />
          <YourApp />
        </FhevmProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Example 8: Error Handling

Proper error handling with user-friendly messages.

```typescript
import { useWriteContract, getUserFriendlyError } from "@fhevm-sdk";
import { toast } from "react-hot-toast";

function TransferWithErrorHandling() {
  const { writeAsync } = useWriteContract({ name: "EncryptedToken" });

  const handleTransfer = async (recipient: string, amount: number) => {
    try {
      const receipt = await writeAsync({
        functionName: "transfer",
        args: [recipient, amount],
      });

      toast.success("Transfer successful!");
      console.log("Receipt:", receipt);
    } catch (error) {
      const friendlyMessage = getUserFriendlyError(error);
      toast.error(friendlyMessage);
      console.error("Transfer failed:", error);
    }
  };

  return (
    <button onClick={() => handleTransfer("0x...", 100)}>
      Transfer with Error Handling
    </button>
  );
}
```

## Example 9: Cache Management

Manually control the decrypt cache.

```typescript
import { useFhevmContext, useReadContract } from "@fhevm-sdk";

function CacheManagement() {
  const { clearCache, decryptCache } = useFhevmContext();

  const { decryptedData, refetch } = useReadContract({
    name: "EncryptedToken",
    functionName: "totalSupply",
  });

  const handleClearCache = () => {
    clearCache();
    refetch(); // Re-fetch and decrypt
  };

  const cacheSize = decryptCache.size;

  return (
    <div>
      <p>Cache entries: {cacheSize}</p>
      <p>Total Supply: {decryptedData?.toString()}</p>
      <button onClick={handleClearCache}>Clear Cache & Refresh</button>
    </div>
  );
}
```

## Example 10: Using Multiple Contracts

Work with multiple contracts in the same component.

```typescript
import { useReadContract } from "@fhevm-sdk";
import { useAccount } from "wagmi";

function MultiContractDashboard() {
  const { address } = useAccount();

  // Token 1 balance
  const { decryptedData: token1Balance } = useReadContract({
    name: "Token1",
    functionName: "balanceOf",
    args: [address],
  });

  // Token 2 balance
  const { decryptedData: token2Balance } = useReadContract({
    name: "Token2",
    functionName: "balanceOf",
    args: [address],
  });

  // DAO voting power
  const { decryptedData: votingPower } = useReadContract({
    name: "DAO",
    functionName: "getVotingPower",
    args: [address],
  });

  return (
    <div className="dashboard">
      <h2>Your Portfolio</h2>
      <div className="balances">
        <div>Token 1: {token1Balance?.toString() || "0"}</div>
        <div>Token 2: {token2Balance?.toString() || "0"}</div>
        <div>Voting Power: {votingPower?.toString() || "0"}</div>
      </div>
    </div>
  );
}
```

## Tips & Best Practices

1. **Use Contract Registry**: Register contracts once in config, use everywhere
2. **Enable Watch Mode**: Use `watch: true` for real-time data
3. **Cache Aggressively**: Let the SDK cache decryptions
4. **Batch When Possible**: Use `useBatchTransactions` for multiple operations
5. **Auto-setup Operators**: Use `autoSetup: true` for better UX
6. **Handle Errors**: Always use `getUserFriendlyError()`
7. **Type Safety**: Use TypeScript and abitype for type-safe contracts
8. **Disable When Needed**: Use `enabled` prop to conditionally fetch

## Common Patterns

### Loading States

```typescript
const { decryptedData, isLoading, isDecrypting } = useReadContract({
  name: "Token",
  functionName: "balanceOf",
  args: [address],
});

if (isLoading) return <Spinner />;
if (isDecrypting) return <DecryptingIndicator />;
return <Balance value={decryptedData} />;
```

### Refetch After Write

```typescript
const { refetch } = useReadContract({ name: "Token", functionName: "balanceOf" });
const { write } = useWriteContract({ name: "Token" });

const handleTransfer = async () => {
  await write({ functionName: "transfer", args: [...] });
  setTimeout(() => refetch(), 2000); // Wait for tx to mine
};
```

### Conditional Decryption

```typescript
const { decryptedData } = useReadContract({
  name: "DAO",
  functionName: "getVotes",
  decrypt: hasPermission, // Only decrypt if user has permission
});
```

## More Examples

For more examples, check:
- `/examples` directory in the repo
- Live demo: https://demo.fhevm.io
- Documentation: https://docs.fhevm.io
