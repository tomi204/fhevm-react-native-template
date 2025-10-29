# FHEVM SDK - Quick Start Guide

Get started with encrypted smart contracts in 5 minutes!

## Installation

```bash
npm install @fhevm-sdk ethers wagmi abitype
```

## Step 1: Create Configuration (2 minutes)

Create a file `lib/fhevm-config.ts`:

```typescript
import { createConfig } from "@fhevm-sdk";

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 8009,
      name: "Zama Devnet",
      rpcUrl: "https://devnet.zama.ai",
    },
  ],
  contracts: {
    MyContract: {
      address: "0x..." as `0x${string}`,
      abi: MyContractABI, // Your contract ABI
    },
  },
  cache: {
    enabled: true,
    ttl: 60000, // Cache decrypted values for 1 minute
  },
});
```

## Step 2: Setup Providers (1 minute)

Wrap your app with `FhevmProvider`:

```typescript
import { FhevmProvider } from "@fhevm-sdk";
import { WagmiProvider } from "wagmi";
import { fhevmConfig } from "./lib/fhevm-config";

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <FhevmProvider config={fhevmConfig}>
        <YourApp />
      </FhevmProvider>
    </WagmiProvider>
  );
}
```

## Step 3: Use Hooks (2 minutes)

### Read Encrypted Data

```typescript
import { useReadContract } from "@fhevm-sdk";

function Balance() {
  const { decryptedData, isLoading } = useReadContract({
    name: "MyContract",
    functionName: "getBalance",
    watch: true, // Auto-refresh every 5 seconds
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>Balance: {decryptedData?.toString()}</div>;
}
```

### Write Encrypted Data

```typescript
import { useWriteContract } from "@fhevm-sdk";

function Transfer() {
  const { write, isLoading } = useWriteContract({
    name: "MyContract",
  });

  const handleTransfer = () => {
    write({
      functionName: "transfer",
      args: ["0x...", 100], // SDK encrypts 100 automatically!
    });
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      Transfer 100 tokens
    </button>
  );
}
```

## That's it! 🎉

You're now using encrypted smart contracts with:
- ✅ Automatic encryption
- ✅ Automatic decryption
- ✅ Built-in caching
- ✅ Type safety
- ✅ Loading states
- ✅ Error handling

## Next Steps

### Add Wallet Connection

```typescript
import { ConnectButton } from "@rainbow-me/rainbowkit";

function Header() {
  return (
    <div>
      <h1>My FHE App</h1>
      <ConnectButton />
    </div>
  );
}
```

### Add Multiple Contracts

```typescript
// In config
contracts: {
  Token: { address: "0x...", abi: TokenABI },
  NFT: { address: "0x...", abi: NFTABI },
  DAO: { address: "0x...", abi: DAOABI },
}

// Use anywhere
const tokenBalance = useReadContract({
  name: "Token",
  functionName: "balanceOf",
});

const nftBalance = useReadContract({
  name: "NFT",
  functionName: "balanceOf",
});
```

### Add Operator Management

```typescript
import { useOperator } from "@fhevm-sdk";

function Setup() {
  const { isOperator, setupOperator } = useOperator({
    name: "MyContract",
    operatorAddress: userAddress,
    autoSetup: true, // Auto-setup on mount
  });

  return (
    <div>
      Status: {isOperator ? "✅ Ready" : "⏳ Setting up..."}
    </div>
  );
}
```

### Batch Multiple Operations

```typescript
import { useBatchTransactions, useContract } from "@fhevm-sdk";

function BatchTransfer() {
  const { contract } = useContract({ name: "Token" });
  const { addToBatch, executeBatch, batch } = useBatchTransactions();

  const handleBatch = () => {
    // Add multiple transfers
    addToBatch({ contract, functionName: "transfer", args: [addr1, 100] });
    addToBatch({ contract, functionName: "transfer", args: [addr2, 200] });

    // Execute all at once
    executeBatch();
  };

  return (
    <button onClick={handleBatch}>
      Send to {batch.length} recipients
    </button>
  );
}
```

## Common Patterns

### Loading States

```typescript
const { data, isLoading, isDecrypting, error } = useReadContract({
  name: "Token",
  functionName: "balanceOf",
});

if (isLoading) return <Spinner />;
if (isDecrypting) return <div>🔓 Decrypting...</div>;
if (error) return <div>Error: {error.message}</div>;
return <div>Balance: {data}</div>;
```

### Success Messages

```typescript
const { write, isSuccess } = useWriteContract({ name: "Token" });

useEffect(() => {
  if (isSuccess) {
    toast.success("Transfer successful!");
  }
}, [isSuccess]);
```

### Error Handling

```typescript
import { getUserFriendlyError } from "@fhevm-sdk";

const { writeAsync } = useWriteContract({ name: "Token" });

try {
  await writeAsync({ functionName: "transfer", args: [...] });
} catch (error) {
  const message = getUserFriendlyError(error);
  toast.error(message);
}
```

### Conditional Fetching

```typescript
const { decryptedData } = useReadContract({
  name: "DAO",
  functionName: "getVotes",
  enabled: isConnected && hasPermission,
});
```

### Auto-refresh Data

```typescript
const { decryptedData, refetch } = useReadContract({
  name: "Token",
  functionName: "balanceOf",
  watch: true, // Refreshes every 5 seconds
});

// Or manually refresh
<button onClick={() => refetch()}>Refresh</button>
```

## Full Example App

```typescript
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useReadContract, useWriteContract } from "@fhevm-sdk";

function TokenApp() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { decryptedData: balance } = useReadContract({
    name: "Token",
    functionName: "balanceOf",
    args: [address],
    enabled: isConnected,
  });

  const { write, isLoading, isSuccess } = useWriteContract({
    name: "Token",
  });

  const handleTransfer = () => {
    write({
      functionName: "transfer",
      args: [recipient, parseInt(amount)],
    });
  };

  return (
    <div className="app">
      <header>
        <h1>Encrypted Token App</h1>
        <ConnectButton />
      </header>

      {isConnected && (
        <main>
          <div className="balance">
            <h2>Your Balance</h2>
            <p>{balance?.toString() || "0"} tokens</p>
          </div>

          <div className="transfer">
            <h2>Transfer Tokens</h2>
            <input
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
            {isSuccess && <p className="success">✅ Transfer successful!</p>}
          </div>
        </main>
      )}
    </div>
  );
}

export default TokenApp;
```

## Troubleshooting

### "Contract not found"
Make sure you registered the contract in your config:
```typescript
contracts: {
  MyContract: { address: "0x...", abi: ABI },
}
```

### "Cannot decrypt value"
Check that:
1. You're connected with a wallet
2. The value is actually encrypted
3. You have decryption permissions

### "Transaction reverted"
Common causes:
- Insufficient balance
- Missing operator permissions
- Invalid arguments

Use `getUserFriendlyError()` for better error messages!

### TypeScript errors
Make sure you have abitype installed:
```bash
npm install abitype
```

## Resources

- 📖 [Full Documentation](./README.md)
- 💡 [10+ Examples](./EXAMPLES.md)
- 🔄 [Changelog](./CHANGELOG.md)
- 💬 [Discord Community](https://discord.gg/fhevm)
- 🐛 [Report Issues](https://github.com/zama-ai/fhevm-sdk/issues)

## Need Help?

- Discord: Fast community support
- GitHub Issues: Bug reports and feature requests
- Documentation: Comprehensive guides and API reference

Happy building with FHE! 🚀🔐
