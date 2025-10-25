# FHEVM React Template

A minimal React frontend template for building FHEVM-enabled decentralized applications (dApps). This template provides a simple development interface for interacting with FHEVM smart contracts, specifically the `FHECounter.sol` contract.

## 🚀 What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) enables computation on encrypted data directly on Ethereum. This template demonstrates how to build dApps that can perform computations while keeping data private.

## ✨ Features

- **🔐 FHEVM Integration**: Built-in support for fully homomorphic encryption
- **⚛️ React + Next.js**: Modern, performant frontend framework
- **🎨 Tailwind CSS**: Utility-first styling for rapid UI development
- **🔗 RainbowKit**: Seamless wallet connection and management
- **🌐 Multi-Network Support**: Works on both Sepolia testnet and local Hardhat node
- **📦 Monorepo Structure**: Organized packages for SDK, contracts, and frontend

## 📋 Prerequinextjss

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **MetaMask** browser extension
- **Git** for cloning the repository

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd fhevm-react-template

# Initialize submodules (includes fhevm-hardhat-template)
git submodule update --init --recursive

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Set up your Hardhat environment variables by following the [FHEVM documentation](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup#set-up-the-hardhat-configuration-variables-optional):

- `MNEMONIC`: Your wallet mnemonic phrase
- `INFURA_API_KEY`: Your Infura API key for Sepolia

### 3. Start Development Environment

**Option A: Local Development (Recommended for testing)**

```bash
# Terminal 1: Start local Hardhat node
pnpm chain
# RPC URL: http://127.0.0.1:8545 | Chain ID: 31337

# Terminal 2: Deploy contracts to localhost
pnpm deploy:localhost

# Terminal 3: Start the frontend
pnpm start
```

**Option B: Sepolia Testnet**

```bash
# Deploy to Sepolia testnet
pnpm deploy:sepolia

# Start the frontend
pnpm start
```

## 📱 React Native Wallet Template

`packages/react-native` now consumes the universal SDK’s **remote client**. TFHE runs inside the relayer, while the mobile app only calls:

```ts
import { createFheClient, useRemoteFheCounter } from "@fhevm-sdk";

const client = await createFheClient({
  contract: { address: "0x...", abi },
  mode: "remote",
  signer, // any ethers.Signer (wallet, wagmi, etc.)
  relayer: { apiKey: process.env.FHE_API_KEY },
});

const counter = useRemoteFheCounter({ client });
```

Under the hood the SDK negotiates a session with the relayer (defaulting to the hosted endpoint if you don’t provide one) and exposes wagmi-like helpers so React Native, Vue, or any frontend can call `read`/`mutate` without touching low-level TFHE APIs.

### Quick start

```bash
pnpm install

# optional: spin up the local Hardhat node + deploy contracts
pnpm chain &
pnpm deploy:localhost

# start the FHE relayer service (see below)
cp packages/relayer-service/.env.example packages/relayer-service/.env
pnpm relayer:dev

# launch the Expo dev server (Android only today)
pnpm mobile
```

1. Use an Android emulator/device (Expo Go iOS cannot run TFHE today).
2. In the app, set **Relayer URL** to `http://10.0.2.2:4000` (Android loopback to your Mac) or to your remote server.
3. Tap **Increment** / **Decrement**; the relayer encrypts/decrypts and returns the up-to-date counter.

### Highlights

- Thin HTTP SDK that works on any mobile runtime (no `SharedArrayBuffer` required on-device).
- Same UX as the web demo, just backed by the relayer.
- Metro config ready for pnpm monorepos; no ejecting required.

> ℹ️ iOS still blocks `SharedArrayBuffer`, so TFHE in Expo Go/dev clients is not possible yet. Use Android with the relayer for now.

## 🔌 FHE Relayer Service (Node)

`packages/relayer-service` is an Express server that loads `@fhevm-sdk`, performs encrypt/decrypt on behalf of clients, and exposes a tiny REST API. Every session is bound to a user address: the client signs each request (simple EIP-191 message) and the relayer verifies the signature + nonce before touching TFHE state. The universal SDK handles these signatures for you.

- `GET /status` – reports chain, signer, and contract info.
- `GET /counter` – returns the latest encrypted handle + decrypted value.
- `POST /counter { delta }` – encrypts the delta, sends the transaction, and returns the updated counter.

### Quick start

```bash
cd packages/relayer-service
cp .env.example .env
# edit RPC_URL / PRIVATE_KEY / CHAIN_ID as needed
pnpm dev          # hot reload
# or pnpm build && pnpm start
```

Environment variables:

- `RPC_URL`: Hardhat or Sepolia RPC endpoint.
- `PRIVATE_KEY`: signer that is allowed to decrypt and send counter transactions.
- `CHAIN_ID`: chain where `FHECounter` is deployed (defaults Sepolia = 11155111).
- `PORT`: HTTP port (defaults to 4000).
- `RELAYER_API_KEYS`: optional comma separated list to restrict access; clients send it as `x-relayer-key`.

Point the React Native app to `http://10.0.2.2:4000` (Android emulator loopback) or expose the service publicly for real devices.

### 4. Connect MetaMask

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Click "Connect Wallet" and select MetaMask
3. If using localhost, add the Hardhat network to MetaMask:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`

### ⚠️ Sepolia Production note

- In production, `NEXT_PUBLIC_ALCHEMY_API_KEY` must be set (see `packages/nextjs/scaffold.config.ts`). The app throws if missing.
- Ensure `packages/nextjs/contracts/deployedContracts.ts` points to your live contract addresses.
- Optional: set `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` for better WalletConnect reliability.
- Optional: add per-chain RPCs via `rpcOverrides` in `packages/nextjs/scaffold.config.ts`.

## 🔧 Troubleshooting

### Common MetaMask + Hardhat Issues

When developing with MetaMask and Hardhat, you may encounter these common issues:

#### ❌ Nonce Mismatch Error

**Problem**: MetaMask tracks transaction nonces, but when you restart Hardhat, the node resets while MetaMask doesn't update its tracking.

**Solution**:
1. Open MetaMask extension
2. Select the Hardhat network
3. Go to **Settings** → **Advanced**
4. Click **"Clear Activity Tab"** (red button)
5. This resets MetaMask's nonce tracking

#### ❌ Cached View Function Results

**Problem**: MetaMask caches smart contract view function results. After restarting Hardhat, you may see outdated data.

**Solution**:
1. **Restart your entire browser** (not just refresh the page)
2. MetaMask's cache is stored in extension memory and requires a full browser restart to clear

> 💡 **Pro Tip**: Always restart your browser after restarting Hardhat to avoid cache issues.

For more details, see the [MetaMask development guide](https://docs.metamask.io/wallet/how-to/run-devnet/).

## 📁 Project Structure

This template uses a monorepo structure with three main packages:

```
fhevm-react-template/
├── packages/
│   ├── fhevm-hardhat-template/    # Smart contracts & deployment
│   ├── fhevm-sdk/                 # FHEVM SDK package
│   ├── nextjs/                    # React frontend application
│   ├── react-native/              # Expo wallet template (talks to relayer)
│   └── relayer-service/           # Node bridge that performs TFHE ops
└── scripts/                       # Build and deployment scripts
```

### Key Components

#### 🔗 FHEVM Integration (`packages/nextjs/hooks/fhecounter-example/`)
- **`useFHECounterWagmi.tsx`**: Example hook demonstrating FHEVM contract interaction
- Essential hooks for FHEVM-enabled smart contract communication
- Easily copyable to any FHEVM + React project

#### 🎣 Wallet Management (`packages/nextjs/hooks/helper/`)
- MetaMask wallet provider hooks
- Compatible with EIP-6963 standard
- Easily adaptable for other wallet providers

#### 🔧 Flexibility
- Replace `ethers.js` with `Wagmi` or other React-friendly libraries
- Modular architecture for easy customization
- Support for multiple wallet providers

## 📚 Additional Resources

### Official Documentation
- [FHEVM Documentation](https://docs.zama.ai/protocol/solidity-guides/) - Complete FHEVM guide
- [FHEVM Hardhat Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat) - Hardhat integration
- [Relayer SDK Documentation](https://docs.zama.ai/protocol/relayer-sdk-guides/) - SDK reference
- [Environment Setup](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup#set-up-the-hardhat-configuration-variables-optional) - MNEMONIC & API keys

### Development Tools
- [MetaMask + Hardhat Setup](https://docs.metamask.io/wallet/how-to/run-devnet/) - Local development
- [React Documentation](https://reactjs.org/) - React framework guide

### Community & Support
- [FHEVM Discord](https://discord.com/invite/zama) - Community support
- [GitHub Issues](https://github.com/zama-ai/fhevm-react-template/issues) - Bug reports & feature requests

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.
