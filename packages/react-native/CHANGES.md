# React Native Implementation Changes

This document summarizes all changes made to implement Reown AppKit (WalletConnect) integration for the React Native FHEVM app.

## Overview

The React Native app now supports real wallet connections via Reown AppKit instead of using ephemeral wallets. All FHE operations (encryption/decryption) are handled server-side by the relayer service, which receives the relayer's private key.

## Important Note: Metro Bundler Mocks

Since the `fhevm-sdk` package is shared between Next.js and React Native, it includes some web-only dependencies (Reown web version, Wagmi, etc.). These are NOT used in React Native, but Metro bundler would fail trying to resolve them.

**Solution**: We've configured Metro to mock these web-only modules in React Native:
- `mocks/@reown-appkit-react.js` - Mocks `@reown/appkit/react`
- `mocks/wagmi.js` - Mocks `wagmi`
- `mocks/@reown-appkit-adapter-wagmi.js` - Mocks `@reown/appkit-adapter-wagmi`
- `mocks/@tanstack-react-query.js` - Mocks `@tanstack/react-query`

These modules are resolved to empty objects in `metro.config.js`, preventing bundling errors.

## New Dependencies

Added to `package.json`:

```json
{
  "@reown/appkit-react-native": "^2.0.1",
  "@reown/appkit-ethers-react-native": "^2.0.1",
  "@walletconnect/react-native-compat": "^2.23.0",
  "@react-native-async-storage/async-storage": "1.23.1",
  "@react-native-community/netinfo": "11.4.1",
  "react-native-svg": "15.8.0",
  "expo-application": "~6.0.2"
}
```

## Configuration Changes

### `babel.config.js`

Updated to support Reown AppKit:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
```

## New Files Created

### Configuration

1. **`src/config/appkit.ts`** - Reown AppKit configuration
   - Defines Sepolia network
   - Creates EthersAdapter
   - Configures AppKit with metadata and settings

2. **`src/config/storage.ts`** - Custom storage adapter
   - Implements Storage interface using AsyncStorage
   - Required for AppKit to persist session data

### Metro Bundler Mocks

3. **`mocks/@reown-appkit-react.js`** - Mock for web Reown
4. **`mocks/wagmi.js`** - Mock for Wagmi
5. **`mocks/@reown-appkit-adapter-wagmi.js`** - Mock for Wagmi adapter
6. **`mocks/@tanstack-react-query.js`** - Mock for React Query

### Hooks

7. **`src/hooks/useWallet.ts`** - Wallet connection hook
   - Wraps Reown's `useAccount` and `useProvider`
   - Provides `address`, `isConnected`, `chainId`, `signer`
   - Extracts chainId from CAIP address format

8. **`src/hooks/useFhevmClient.ts`** - FHE client management
   - Creates FHE client connected to relayer
   - Manages client lifecycle based on wallet connection
   - Handles errors and loading states

9. **`src/hooks/index.ts`** - Barrel export for all hooks

### Components

10. **`src/components/WalletButton.tsx`** - Wallet connection button
    - Shows "Connect Wallet" when disconnected
    - Displays abbreviated address when connected
    - Opens Reown modal on press

### Documentation

11. **`README.md`** - Comprehensive documentation
    - Architecture explanation
    - Setup instructions
    - Troubleshooting guide
    - API reference

12. **`QUICK_START.md`** - Quick start guide
    - Step-by-step setup (5 minutes)
    - Platform-specific instructions
    - Common issues and solutions

13. **`.env.example`** - Environment variables template
    - Shows required Reown Project ID

14. **`CHANGES.md`** - This file, documenting all changes

## Modified Files

### `metro.config.js`

**Updated Metro Bundler Configuration**:
- Added resolver mocks for web-only dependencies
- Configured `extraNodeModules` to resolve web packages to empty mocks
- This allows the shared `fhevm-sdk` to work in both Next.js and React Native

### `babel.config.js`

**Updated for Reown AppKit**:
- Added `unstable_transformImportMeta: true` to babel-preset-expo
- Required for WalletConnect/Reown compatibility

### `App.tsx`

**Major Rewrite** (original backed up to `App.old.tsx`):

- Added Reown AppKit imports and providers
- Wrapped app in `AppKitProvider` and `SafeAreaProvider`
- Replaced `useEphemeralWallet` with `useWallet`
- Added `WalletButton` component
- Updated client creation to use `useFhevmClient` hook
- Added wallet connection status to UI
- Disabled operations when wallet not connected
- Added AppKit modal overlay

**Key Changes**:
```typescript
// Old (ephemeral wallet)
const wallet = useEphemeralWallet();

// New (Reown wallet)
const { address, isConnected, signer } = useWallet();
const { client, error, isLoading } = useFhevmClient({
  contractAddress,
  contractAbi,
  contractName,
  relayerBaseUrl,
});
```

## Preserved Files (Unchanged)

The following existing functionality was **NOT modified**:

- `src/components/ActionButton.tsx`
- `src/components/InfoRow.tsx`
- `src/components/Section.tsx`
- `src/utils/format.ts`
- `src/hooks/useEphemeralWallet.ts` (kept for reference)
- `contracts/` directory
- `package.json` scripts
- `tsconfig.json`

## Next.js Package

**MOSTLY UNTOUCHED** - No functional changes were made to:
- `packages/nextjs/*` - All Next.js code preserved
- Next.js hooks and components
- Wagmi integration
- Any existing functionality

**Note for Next.js Users:** If you use Reown connectors from the SDK, you now need to import them explicitly:

```typescript
// Old way (no longer works):
// import { ReownProvider, ConnectButton } from "fhevm-sdk";

// New way:
import { ReownProvider, ConnectButton } from "fhevm-sdk/connectors/reown";
```

This change was necessary to prevent React Native's Metro bundler from trying to resolve web-only dependencies.

## Architecture

### Before (Ephemeral Wallet)
```
[App] → [Ephemeral Wallet] → [FHE Client] → [Relayer] → [Blockchain]
```

### After (Reown Integration)
```
[App] → [Reown AppKit] → [Mobile Wallet]
          ↓
    [useWallet Hook] → [Signer]
          ↓
    [useFhevmClient] → [FHE Client] → [Relayer] → [Blockchain]
                                          ↓
                                    [Encrypt/Decrypt]
                                    (Server-side with
                                     relayer private key)
```

### Relayer Service Role

The relayer service (`packages/relayer-service`):

1. **Receives** the relayer's wallet private key via `.env`
2. **Creates sessions** for users (`POST /v1/sessions`)
3. **Encrypts** function arguments server-side (`POST /v1/fhe/mutate`)
4. **Decrypts** encrypted values from blockchain (`POST /v1/fhe/read`)
5. **Signs** transactions using the relayer's private key
6. **Verifies** user signatures for authentication (nonce-based)

The mobile app **never** handles raw private keys for FHE operations.

## Environment Variables

### Required for React Native App

- `EXPO_PUBLIC_REOWN_PROJECT_ID` - Get from [cloud.reown.com](https://cloud.reown.com)

### Required for Relayer Service

- `RPC_URL` - Sepolia RPC endpoint
- `PRIVATE_KEY` - Relayer's wallet private key (for signing/encryption)
- `PORT` - Server port (default: 4000)
- `CHAIN_ID` - Chain ID (default: 11155111 for Sepolia)
- `RELAYER_API_KEYS` - Optional API keys for authentication

## Testing

To test the implementation:

1. Start relayer: `pnpm relayer:dev`
2. Start app: `pnpm mobile`
3. Connect wallet via Reown
4. Verify session shows "Ready"
5. Test Increment/Decrement operations
6. Verify counter value updates

## Breaking Changes

- App now requires a connected wallet (via Reown) to function
- Users must have a WalletConnect-compatible mobile wallet
- Relayer service must be running and accessible

## Migration from Ephemeral Wallet

The original ephemeral wallet version is preserved in `App.old.tsx` for reference. To revert:

```bash
cp App.old.tsx App.tsx
```

## Future Enhancements

Potential improvements:

- [ ] Support multiple chains (mainnet, other testnets)
- [ ] Add transaction history
- [ ] Implement token transfers
- [ ] Add batch operations
- [ ] Support custom token contracts
- [ ] Add biometric authentication
- [ ] Implement offline mode

## Summary

This implementation successfully integrates Reown AppKit for wallet connections while maintaining the relayer-based architecture for FHE operations. The relayer continues to handle all encryption/decryption using its own private key, ensuring the mobile app remains lightweight and secure.
