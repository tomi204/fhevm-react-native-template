# FHEVM React Native App

A React Native mobile application demonstrating Fully Homomorphic Encryption (FHE) using Zama's FHEVM with Reown AppKit (WalletConnect) for wallet connections.

## Features

- 🔐 **Wallet Connection**: Connect mobile wallets using Reown AppKit (WalletConnect v2)
- 🔒 **FHE Operations**: Perform confidential counter operations (increment/decrement) with encrypted data
- 🌐 **Relayer Support**: All encryption/decryption happens server-side via the relayer service
- 📱 **Cross-Platform**: Works on iOS, Android, and Web
- ⚡ **Real-time Updates**: Automatic UI updates when encrypted values change

## Architecture

This app uses a **relayer-based architecture** where:

1. **Mobile App** (this package) - User interface and wallet connection
2. **Relayer Service** (`packages/relayer-service`) - Handles FHE encryption/decryption server-side
3. **Smart Contracts** (`packages/hardhat`) - FHE-enabled contracts on Sepolia testnet

The relayer service:
- Receives the relayer's private key (configured in `.env`)
- Encrypts function arguments before sending transactions
- Decrypts encrypted values returned from the blockchain
- Signs operations on behalf of users (authentication via signature verification)

## Prerequisites

- Node.js >= 20.0.0
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- A Reown Project ID from [https://cloud.reown.com](https://cloud.reown.com)

## Setup

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

Or from this package:

```bash
cd packages/react-native
bun install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and add your Reown Project ID:

```
EXPO_PUBLIC_REOWN_PROJECT_ID=your_actual_project_id
```

Get a free project ID at [https://cloud.reown.com](https://cloud.reown.com)

### 3. Start the Relayer Service

The relayer service must be running for the app to work. From the repository root:

```bash
# Configure relayer service (see packages/relayer-service/.env.example)
cd packages/relayer-service
cp .env.example .env
# Edit .env with your RPC_URL and PRIVATE_KEY

# Start the relayer
pnpm relayer:dev
```

The relayer will start on `http://localhost:4000`

### 4. Configure Relayer URL (Mobile Development)

For iOS Simulator:
- Use `http://localhost:4000`

For Android Emulator:
- Use `http://10.0.2.2:4000` (Android's special alias for host machine)

For Physical Devices:
- Use your computer's local IP address, e.g., `http://192.168.1.100:4000`
- Make sure your device and computer are on the same network

You can override the relayer URL in the app's "Relayer Settings" section.

## Running the App

### Development

From the repository root:

```bash
# Start Expo development server
pnpm mobile

# Or run on specific platform
pnpm mobile:ios
pnpm mobile:android
pnpm mobile:web
```

From this package:

```bash
# Start Expo
bun start

# Run on iOS
bun ios

# Run on Android
bun android

# Run on web
bun web
```

## How It Works

### 1. Wallet Connection

The app uses Reown AppKit for wallet connections:

```typescript
// src/config/appkit.ts
export const appKit = createAppKit({
  projectId: "YOUR_PROJECT_ID",
  networks: [sepolia],
  adapters: [ethersAdapter],
  // ...
});
```

Users can connect any WalletConnect-compatible mobile wallet (MetaMask, Rainbow, etc.)

### 2. FHE Client Creation

Once connected, the app creates an FHE client via the relayer:

```typescript
const { client } = useFhevmClient({
  contractAddress: "0x...",
  contractAbi: [...],
  contractName: "FHECounter",
  relayerBaseUrl: "http://localhost:4000",
});
```

The relayer:
- Creates a session for the user
- Manages the FHE instance
- Handles encryption/decryption with its private key

### 3. Counter Operations

The app demonstrates basic FHE operations:

- **Refresh**: Reads the encrypted counter value, relayer decrypts it
- **Increment**: Encrypts "+1" on relayer, sends transaction
- **Decrement**: Encrypts "-1" on relayer, sends transaction

All operations are signed by the connected wallet but encrypted/decrypted by the relayer.

## Project Structure

```
packages/react-native/
├── App.tsx                    # Main app component with Reown integration
├── App.old.tsx               # Original ephemeral wallet version (backup)
├── src/
│   ├── components/
│   │   ├── ActionButton.tsx  # Reusable button component
│   │   ├── InfoRow.tsx       # Key-value display row
│   │   ├── Section.tsx       # Section container
│   │   ├── WalletButton.tsx  # Reown wallet connection button
│   │   └── index.ts
│   ├── config/
│   │   ├── appkit.ts        # Reown AppKit configuration
│   │   └── storage.ts       # AsyncStorage adapter for Reown
│   ├── hooks/
│   │   ├── useFhevmClient.ts      # FHE client management
│   │   ├── useWallet.ts            # Wallet connection hook
│   │   ├── useEphemeralWallet.ts  # Ephemeral wallet (legacy)
│   │   └── index.ts
│   └── utils/
│       └── format.ts         # Message formatting utilities
├── mocks/                    # Metro bundler mocks for web-only modules
│   ├── @reown-appkit-react.js
│   ├── wagmi.js
│   ├── @reown-appkit-adapter-wagmi.js
│   └── @tanstack-react-query.js
├── contracts/               # Deployed contract ABIs
├── metro.config.js         # Metro config with module mocks
├── babel.config.js         # Babel config with Reown support
└── package.json
```

## Key Hooks

### `useWallet()`

Connects to the user's wallet via Reown AppKit:

```typescript
const { address, isConnected, chainId, signer } = useWallet();
```

### `useFhevmClient()`

Creates an FHE client connected to the relayer:

```typescript
const { client, error, isLoading, isReady } = useFhevmClient({
  contractAddress: "0x...",
  contractAbi: [...],
  contractName: "FHECounter",
  relayerBaseUrl: "http://localhost:4000",
});
```

### `useRemoteFheCounter()`

Manages counter operations via the relayer:

```typescript
const { value, handle, increment, decrement, refresh, isMutating } = useRemoteFheCounter({ client });
```

## Technical Details

### Metro Bundler Configuration

Since `fhevm-sdk` is shared between Next.js and React Native, it includes some web-only dependencies that aren't needed in React Native:

- `@reown/appkit/react` (web version of Reown)
- `wagmi` (web-only Ethereum library)
- `@reown/appkit-adapter-wagmi`
- `@tanstack/react-query`

To prevent bundling errors, we've configured Metro to resolve these to empty mocks in `metro.config.js`. The mocks are located in the `mocks/` directory. This allows the SDK to compile without errors while ensuring these modules are never actually used in React Native.

**This is expected and by design** - React Native uses `@reown/appkit-react-native` instead.

## Troubleshooting

### "Unable to resolve module @reown/appkit/react"

This should be automatically handled by the Metro bundler mocks. If you still see this error:
1. Stop the Metro bundler (Ctrl+C)
2. Clear the cache: `npx expo start --clear`
3. Ensure `metro.config.js` has the mock configuration
4. Check that `mocks/` directory exists with all mock files

### "Unable to resolve module @walletconnect/react-native-compat"

Make sure you have:
1. Run `pnpm install` or `bun install`
2. Imported `"@walletconnect/react-native-compat"` at the top of `App.tsx`
3. Configured `babel.config.js` with `unstable_transformImportMeta: true`

### Relayer Connection Failed

- Check that the relayer service is running (`pnpm relayer:dev`)
- Verify the relayer URL is correct for your platform (iOS/Android/physical device)
- Check firewall settings if using physical device

### Wallet Not Connecting

- Ensure you have a valid Reown Project ID in `.env`
- Make sure you're on Sepolia testnet (chain ID 11155111)
- Try a different wallet app

## Next Steps

- [ ] Add more FHE operations (transfer, approve, etc.)
- [ ] Support multiple chains
- [ ] Add transaction history
- [ ] Implement error recovery
- [ ] Add unit tests

## Resources

- [Reown AppKit Docs](https://docs.reown.com/appkit/react-native/core/installation)
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [Expo Documentation](https://docs.expo.dev/)

## License

BSD-3-Clause-Clear
