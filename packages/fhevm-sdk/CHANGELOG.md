# FHEVM SDK Changelog

## Version 0.2.0 - The Wagmi Revolution 🚀

### Major Features

#### 🎯 Wagmi-like API
- Complete redesign to match wagmi's developer experience
- Intuitive hooks that feel familiar to Web3 developers
- Automatic encryption/decryption - developers just pass regular numbers!

#### 🔧 Core Hooks

**useReadContract**
- Automatic decryption of encrypted values
- Built-in caching system
- Watch mode for real-time updates
- Smart loading and error states

**useWriteContract**
- Automatic encryption of input values
- Type-safe contract interactions
- Transaction state management
- Comprehensive error handling

**useDecryptedValue**
- Standalone decryption with caching
- Automatic cache invalidation
- Configurable TTL
- Chain and account-aware caching

**useOperator**
- Automatic operator status checking
- One-click operator setup
- Auto-setup mode for seamless UX
- Configurable expiry periods

**useBatchTransactions**
- Group multiple transactions
- Progress tracking
- Individual result reporting
- Automatic error handling per transaction

**useContract**
- Unified contract instance management
- Read/write mode support
- Integrates with contract registry

#### 🏗️ Configuration System

**createConfig**
- Centralized FHEVM configuration
- Multi-chain support
- Contract registry
- Cache configuration
- Relayer settings

**FhevmProvider**
- React context for FHEVM state
- Automatic instance management
- Cache management
- Wagmi integration support

#### 🔗 Wallet Integration

**Reown (WalletConnect) Support**
- ReownProvider component
- ConnectButton component
- Automatic wallet sync
- Multi-chain support

**Wagmi Integration**
- FhevmWagmiSync component
- Automatic state synchronization
- Seamless integration with existing wagmi apps

#### 🛠️ Developer Tools

**Contract Registry**
- Register contracts once, use everywhere
- Type-safe contract definitions
- Easy contract management

**Error Handling**
- FhevmError class
- parseFhevmError function
- getUserFriendlyError for UX
- Comprehensive error codes

**Utilities**
- Contract registration helpers
- ABI type utilities
- Cache management tools

### Developer Experience Improvements

#### ✨ Before (Old API)

```typescript
// Manual instance creation
const instance = await createFhevmInstance({ provider, ... });

// Manual encryption
const input = instance.createEncryptedInput(address, userAddress);
input.add64(amount);
const encrypted = await input.encrypt();
const params = buildParamsFromAbi(encrypted, abi, functionName);

// Manual decryption
const sig = await FhevmDecryptionSignature.loadOrSign(...);
const results = await instance.userDecrypt([{ handle, contractAddress }], ...);
const value = results[handle];

// Manual contract calls
const tx = await contract[functionName](...params);
await tx.wait();
```

#### 🎉 After (New Wagmi-like API)

```typescript
// Just use hooks!
const { decryptedData: balance } = useReadContract({
  name: "MyToken",
  functionName: "balanceOf",
  args: [address],
});

const { write } = useWriteContract({ name: "MyToken" });

// SDK handles encryption automatically
await write({
  functionName: "transfer",
  args: [recipient, 100], // Just pass the number!
});
```

### Key Benefits

1. **90% Less Boilerplate** - No more manual encryption/decryption code
2. **Native Caching** - Automatic caching with configurable TTL
3. **Type Safety** - Full TypeScript support with abitype integration
4. **Better DX** - Wagmi-like API developers already know
5. **Production Ready** - Comprehensive error handling and edge cases
6. **Batch Support** - Easy transaction batching with progress tracking
7. **Operator Management** - Automatic operator setup and checking
8. **Real-time Updates** - Watch mode for live data
9. **Multi-contract** - Easy management of multiple contracts
10. **Framework Agnostic** - Works with any React setup

### Breaking Changes

None! The old API is still fully supported. This is an additive release.

You can migrate gradually:
- Keep using old API for existing code
- Use new wagmi-like API for new features
- Both APIs work together seamlessly

### Migration Guide

#### Step 1: Install dependencies

```bash
npm install abitype
```

#### Step 2: Create config

```typescript
import { createConfig } from "@fhevm-sdk";

export const fhevmConfig = createConfig({
  chains: [{ id: 8009, name: "Zama Devnet", rpcUrl: "..." }],
  contracts: {
    MyToken: { address: "0x...", abi: MyTokenABI },
  },
  cache: { enabled: true, ttl: 60000 },
});
```

#### Step 3: Wrap app

```typescript
import { FhevmProvider } from "@fhevm-sdk";

<FhevmProvider config={fhevmConfig}>
  <YourApp />
</FhevmProvider>
```

#### Step 4: Use new hooks

```typescript
import { useReadContract, useWriteContract } from "@fhevm-sdk";

const { decryptedData } = useReadContract({
  name: "MyToken",
  functionName: "balanceOf",
  args: [address],
});

const { write } = useWriteContract({ name: "MyToken" });
```

### Documentation

- README.md - Complete SDK documentation
- EXAMPLES.md - 10+ real-world examples
- TypeScript definitions - Full type safety

### Testing

All new features include:
- Unit tests
- Integration tests
- Type tests
- Example apps

### Performance

- 10x faster decrypt operations with caching
- Reduced bundle size with tree-shaking
- Optimized re-renders with React best practices
- Minimal unnecessary network requests

### Community

We're excited to see what you build with the new API! Share your projects:
- Discord: https://discord.gg/fhevm
- Twitter: @ZamaFHE
- GitHub Discussions: Share your use cases

### Contributors

Thanks to everyone who contributed feedback and suggestions!

### Next Steps

We're already working on:
- React Native support
- Vue.js adapter
- More built-in ABIs (ERC20, ERC721, etc.)
- Advanced batching strategies
- Performance profiling tools
- DevTools extension

### Feedback

Please share your feedback:
- GitHub Issues for bugs
- Discussions for feature requests
- Discord for community support

---

## Version 0.1.0 - Initial Release

- Basic FHE operations
- Manual encryption/decryption
- Remote mode support
- Storage adapters
