# FHEVM React Native & Next.js SDK

A comprehensive monorepo for building privacy-preserving applications with Fully Homomorphic Encryption (FHE) using Zama's FHEVM technology. This project includes an SDK, React Native mobile app, Next.js web app, smart contracts, and relayer service.

## 🚀 What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) enables smart contracts to work with encrypted data without ever decrypting it. This allows for:

- **Private transactions** - Transfer amounts remain secret
- **Confidential balances** - Account balances are encrypted on-chain
- **Encrypted voting** - Vote choices remain private until reveal
- **Private auctions** - Bids stay secret until auction ends
- **And much more...**

## Project Structure

This monorepo contains:

```
fhevm-react-native-template/
├── packages/
│   ├── fhevm-sdk/          # Core SDK for React & React Native
│   ├── react-native/       # React Native mobile wallet app
│   ├── nextjs/             # Next.js web application
│   ├── hardhat/            # Smart contracts & deployment
│   ├── relayer-service/    # Backend relayer for mobile apps
│   └── docs/               # Docusaurus documentation
├── test-app/               # Standalone test app
└── scripts/                # Build and deployment scripts
```

## 📦 Packages Overview

### 🔐 fhevm-sdk

The core SDK providing React hooks and utilities for FHEVM applications.

**Features:**
- 🔐 Automatic encryption/decryption
- 🎣 React hooks for contracts, tokens, and operators
- 💾 Caching for optimized performance
- 🌐 Universal (React, React Native, Next.js)
- 📝 Full TypeScript support
- 🔌 Wagmi-like API design

**Installation:**
```bash
npm install fhevm-sdk
# or
pnpm add fhevm-sdk
```

**Quick Start:**
```typescript
import { FhevmProvider, createConfig, useReadContract } from 'fhevm-sdk';
import { sepolia } from 'wagmi/chains';

// 1. Create config
const config = createConfig({
  chains: [sepolia],
  contracts: {
    myToken: {
      address: '0x...',
      abi: [...],
    },
  },
});

// 2. Wrap your app
function App() {
  return (
    <FhevmProvider config={config}>
      <YourComponent />
    </FhevmProvider>
  );
}

// 3. Use hooks
function YourComponent() {
  const { decryptedData, isLoading } = useReadContract({
    name: 'myToken',
    functionName: 'balanceOf',
    args: [address],
    decrypt: true, // Auto-decrypt encrypted values
  });

  return <div>Balance: {decryptedData}</div>;
}
```

### 📱 React Native App

A mobile wallet application demonstrating FHEVM integration with Reown AppKit (WalletConnect).

**Features:**
- 🔐 Wallet connection via Reown AppKit
- 🔒 FHE counter operations (increment/decrement)
- 🌐 Relayer-based architecture
- 📱 Cross-platform (iOS, Android, Web)
- ⚡ Real-time encrypted data updates

**Quick Start:**
```bash
cd packages/react-native
bun install
bun start
```

[See React Native Documentation →](./packages/react-native/README.md)

### 🌐 Next.js Web App

A modern web application showcasing FHEVM capabilities.

**Features:**
- 🎨 Beautiful UI with Tailwind CSS
- 🔐 FHE Counter Demo
- 💰 Confidential Token Demo (ERC-20 with encrypted balances)
- 🔗 Rainbow Kit integration
- 📊 Real-time decryption
- 🎯 Type-safe with TypeScript

**Quick Start:**
```bash
cd packages/nextjs
pnpm install
pnpm dev
```

Visit `http://localhost:3000`

### ⛓️ Hardhat Contracts

Smart contracts with FHEVM support.

**Included Contracts:**
- `FHECounter.sol` - Encrypted counter with increment/decrement
- `ConfidentialERC20.sol` - ERC-20 with fully encrypted balances
- `EncryptedVoting.sol` - Private voting system

**Quick Start:**
```bash
cd packages/hardhat
pnpm install
pnpm chain  # Start local node
pnpm deploy:localhost
```

### 🔄 Relayer Service

Backend service for mobile apps to handle FHE operations server-side.

**Features:**
- 🔐 Server-side encryption/decryption
- 🔑 Key management
- 📡 RESTful API
- 🎯 Session management
- 🛡️ Signature verification

**Quick Start:**
```bash
cd packages/relayer-service
cp .env.example .env
# Edit .env with your RPC_URL and PRIVATE_KEY
pnpm relayer:dev
```

Server runs on `http://localhost:4000`

### 📚 Documentation

Comprehensive Docusaurus documentation site.

**Quick Start:**
```bash
pnpm docs:start
```

Visit `http://localhost:3001`

## 🎣 Available Hooks

The SDK provides powerful React hooks for FHEVM operations:

### Contract Hooks
- **`useContract`** - Get a contract instance
- **`useReadContract`** - Read from contracts with auto-decryption
- **`useWriteContract`** - Write to contracts with auto-encryption
- **`useDecryptedValue`** - Decrypt encrypted handles

### Token Hooks
- **`useTokenBalance`** - Read token balances (standard or confidential)
- **`useTokenTransfer`** - Transfer tokens with automatic encryption

### Utility Hooks
- **`useOperator`** - Manage operator permissions
- **`useBatchTransactions`** - Batch multiple transactions

### Legacy Hooks (React-only)
- **`useFhevm`** - Initialize FHEVM instance
- **`useFHEEncryption`** - Encrypt data
- **`useFHEDecrypt`** - Decrypt data
- **`useFheCounter`** - Counter operations
- **`useRemoteFheCounter`** - Remote counter (via relayer)

[Full Hook Documentation →](./packages/docs/docs/hooks/overview.md)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.0.0
- **pnpm** (recommended) or npm
- **MetaMask** browser extension
- **Git** for cloning the repository
- For React Native: **Expo CLI**, **Xcode** (iOS), or **Android Studio** (Android)

## 🛠️ Getting Started

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd fhevm-react-native-template
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Build the SDK:**
```bash
pnpm sdk:build
```

### Running the Projects

#### Start Local Blockchain
```bash
pnpm chain
```

#### Deploy Contracts
```bash
pnpm deploy:localhost
```

#### Run Next.js Web App
```bash
pnpm start
```

Visit `http://localhost:3000`

#### Run React Native App
```bash
pnpm mobile
# or
pnpm mobile:ios
pnpm mobile:android
```

#### Start Relayer Service
```bash
pnpm relayer:dev
```

## 📝 Configuration

### FHEVM Config

Create a config with your chains and contracts:

```typescript
import { createConfig } from 'fhevm-sdk';
import { sepolia } from 'wagmi/chains';

const config = createConfig({
  chains: [sepolia],
  contracts: {
    myToken: {
      address: '0xYourContractAddress',
      abi: [...],
    },
  },
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});
```

### Environment Variables

#### Next.js (.env.local)
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

#### React Native (.env)
```bash
EXPO_PUBLIC_REOWN_PROJECT_ID=your_project_id
```

#### Relayer Service (.env)
```bash
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_relayer_private_key
PORT=4000
```

## 💡 Examples

### Basic Counter

```typescript
import { useReadContract, useWriteContract } from 'fhevm-sdk';

function Counter() {
  // Read encrypted counter
  const { decryptedData: count, isDecrypting } = useReadContract({
    name: 'FHECounter',
    functionName: 'getCounter',
    args: [userAddress],
    decrypt: true,
  });

  // Write to counter
  const { write: increment, isLoading } = useWriteContract({
    name: 'FHECounter',
  });

  return (
    <div>
      <p>Count: {isDecrypting ? '...' : count}</p>
      <button
        onClick={() => increment({ functionName: 'increment' })}
        disabled={isLoading}
      >
        Increment
      </button>
    </div>
  );
}
```

### Confidential Token Transfer

```typescript
import { useTokenBalance, useTokenTransfer } from 'fhevm-sdk';

function TokenWallet({ address }) {
  // Read encrypted balance
  const { balanceFormatted, isDecrypting, refetch } = useTokenBalance({
    name: 'ConfidentialToken',
    account: address,
    isConfidential: true,
  });

  // Transfer tokens
  const { transfer, isLoading } = useTokenTransfer({
    name: 'ConfidentialToken',
    isConfidential: true,
  });

  const handleTransfer = async () => {
    await transfer({
      to: '0xRecipient...',
      amount: '100',
      decimals: 18,
    });
    await refetch();
  };

  return (
    <div>
      <p>Balance: {isDecrypting ? 'Decrypting...' : balanceFormatted}</p>
      <button onClick={handleTransfer} disabled={isLoading}>
        Transfer 100 Tokens
      </button>
    </div>
  );
}
```

### React Native with Relayer

```typescript
import { useFhevmClient, useRemoteFheCounter } from 'fhevm-sdk';

function MobileCounter({ contractAddress, contractAbi }) {
  const { client, isReady } = useFhevmClient({
    contractAddress,
    contractAbi,
    contractName: 'FHECounter',
    relayerBaseUrl: 'http://localhost:4000',
  });

  const { value, increment, decrement, refresh, isMutating } =
    useRemoteFheCounter({ client });

  if (!isReady) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Counter: {value ?? 'Loading...'}</Text>
      <Button title="+" onPress={increment} disabled={isMutating} />
      <Button title="-" onPress={decrement} disabled={isMutating} />
      <Button title="Refresh" onPress={refresh} />
    </View>
  );
}
```

## 🏗️ Architecture

### Web Apps (Next.js)

```
┌─────────────┐
│   Next.js   │
│     App     │
└──────┬──────┘
       │
       │ uses hooks
       ▼
┌─────────────┐      ┌──────────────┐
│  fhevm-sdk  │◄─────┤ FHEVM Instance│
│   Hooks     │      │  (fhevmjs)   │
└──────┬──────┘      └──────────────┘
       │
       │ encrypts/decrypts
       ▼
┌─────────────┐
│  Ethereum   │
│   Network   │
└─────────────┘
```

### Mobile Apps (React Native)

```
┌─────────────┐
│React Native │
│     App     │
└──────┬──────┘
       │
       │ HTTP requests
       ▼
┌─────────────┐      ┌──────────────┐
│   Relayer   │◄─────┤ FHEVM Instance│
│   Service   │      │  (fhevmjs)   │
└──────┬──────┘      └──────────────┘
       │
       │ encrypts/decrypts
       ▼
┌─────────────┐
│  Ethereum   │
│   Network   │
└─────────────┘
```

## 🌐 Network Support

### Supported Networks

- **Local Development**: Hardhat local node (chainId: 31337)
- **Testnet**: Sepolia (chainId: 11155111)
- **Zama Devnet**: (chainId: 8009)

### Adding Custom Networks

```typescript
const customNetwork = {
  id: 12345,
  name: 'Custom Network',
  network: 'custom',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.custom.network'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.custom.network' },
  },
};

const config = createConfig({
  chains: [customNetwork],
  // ...
});
```

## 🛠️ Development

### Scripts

```bash
# SDK Development
pnpm sdk:build        # Build SDK
pnpm sdk:watch        # Watch mode
pnpm sdk:test         # Run tests
pnpm sdk:clean        # Clean build

# Blockchain
pnpm chain            # Start local node
pnpm deploy:localhost # Deploy to local
pnpm deploy:sepolia   # Deploy to Sepolia

# Applications
pnpm start            # Start Next.js
pnpm mobile           # Start React Native
pnpm relayer:dev      # Start relayer

# Documentation
pnpm docs:start       # Start docs
pnpm docs:build       # Build docs

# Testing
pnpm test             # Run all tests
pnpm lint             # Lint code
```

### Testing

```bash
# Unit tests
pnpm sdk:test

# Contract tests
pnpm hardhat:test

# Watch mode
pnpm sdk:test:watch
```

### Building for Production

```bash
# Build SDK
pnpm sdk:build

# Build Next.js
pnpm next:build

# Build docs
pnpm docs:build
```

## 🔧 Troubleshooting

### Common Issues

#### "Module not found: @reown/appkit/react"
This is expected in React Native. The SDK uses mocks for web-only dependencies. Make sure you have the metro.config.js properly configured.

#### "Unable to resolve module @walletconnect/react-native-compat"
Run `pnpm install` or `bun install` in the react-native package.

#### Relayer Connection Failed
- Check that the relayer service is running on the correct port
- For Android emulator, use `http://10.0.2.2:4000`
- For iOS simulator, use `http://localhost:4000`
- For physical devices, use your computer's local IP address
- Check firewall settings if using physical device

#### Decryption Fails
- Ensure you have approved the decryption signature request
- Check that you're connected to the correct network
- Verify the contract address is correct
- Clear cache and retry

#### Nonce Mismatch Error (MetaMask + Hardhat)
**Problem**: MetaMask tracks transaction nonces, but when you restart Hardhat, the node resets while MetaMask doesn't update its tracking.

**Solution**:
1. Open MetaMask extension
2. Select the Hardhat network
3. Go to **Settings** → **Advanced**
4. Click **"Clear Activity Tab"** (red button)
5. This resets MetaMask's nonce tracking

#### Cached View Function Results
**Problem**: MetaMask caches smart contract view function results. After restarting Hardhat, you may see outdated data.

**Solution**:
1. **Restart your entire browser** (not just refresh the page)
2. MetaMask's cache is stored in extension memory and requires a full browser restart to clear

> 💡 **Pro Tip**: Always restart your browser after restarting Hardhat to avoid cache issues.

### Debug Mode

Enable debug logging:

```typescript
// In your app
localStorage.setItem('DEBUG', 'fhevm:*');
```

## 📦 Package Details

### fhevm-sdk

**Location**: `packages/fhevm-sdk/`

**Exports:**
- `FhevmProvider` - React context provider
- `createConfig` - Configuration builder
- `useContract`, `useReadContract`, `useWriteContract` - Contract hooks
- `useTokenBalance`, `useTokenTransfer` - Token hooks
- `useOperator`, `useBatchTransactions` - Utility hooks
- `useDecryptedValue` - Decryption hook
- Legacy hooks: `useFhevm`, `useFHEEncryption`, `useFHEDecrypt`

### react-native

**Location**: `packages/react-native/`

**Key Features:**
- Reown AppKit integration for wallet connection
- Metro bundler configuration for monorepo
- Mock files for web-only dependencies
- Example implementation with FHE Counter

### nextjs

**Location**: `packages/nextjs/`

**Key Features:**
- Rainbow Kit integration
- FHE Counter Demo
- Confidential Token Demo
- Wagmi integration
- Server-side rendering support

### hardhat

**Location**: `packages/hardhat/`

**Contracts:**
- `FHECounter.sol` - Basic encrypted counter
- `ConfidentialERC20.sol` - Token with encrypted balances
- Deployment scripts for all networks

### relayer-service

**Location**: `packages/relayer-service/`

**API Endpoints:**
- `GET /status` - Service status and configuration
- `GET /counter` - Read encrypted counter value
- `POST /counter` - Modify counter value
- Session management with signature verification

## 📚 Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm) - Official FHEVM docs
- [Zama.ai](https://zama.ai) - Zama homepage
- [fhevmjs Library](https://github.com/zama-ai/fhevmjs) - Core FHE library
- [Reown AppKit](https://docs.reown.com/appkit) - Wallet connection library
- [Wagmi Documentation](https://wagmi.sh) - React hooks for Ethereum

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

This project handles cryptographic operations. Please:

- Never commit private keys
- Use environment variables for sensitive data
- Audit smart contracts before mainnet deployment
- Report security issues privately

## 📄 License

BSD-3-Clause-Clear

## 💬 Support

- Documentation: [packages/docs/](./packages/docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Discord: [Zama Discord](https://discord.gg/zama)

---

Built with ❤️ using [Zama's FHEVM](https://zama.ai)
