---
sidebar_position: 4
---

# React Native

Using the FHEVM SDK in React Native applications with Reown AppKit (WalletConnect).

## Overview

The React Native implementation uses a **relayer-based architecture** where encryption/decryption operations are performed server-side. This provides:

- Faster initialization (no WASM loading)
- Smaller bundle size
- Better performance on mobile devices
- Lower memory footprint

## Architecture

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

## Installation

```bash
# Install dependencies
npm install fhevm-sdk ethers
npm install @reown/appkit-react-native @walletconnect/react-native-compat
```

## Relayer Setup

First, start the relayer service:

```bash
cd packages/relayer-service
cp .env.example .env
# Edit .env with your RPC_URL and PRIVATE_KEY
npm run dev
```

The relayer will run on `http://localhost:4000`

## Configuration

```typescript
// No config needed for relayer mode
// The SDK connects directly to the relayer
```

## Wallet Connection with Reown

```typescript
// src/hooks/useWallet.ts
import { useMemo } from 'react';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit-react-native';
import { ethers, BrowserProvider } from 'ethers';

export function useWallet() {
  const { walletProvider } = useAppKitProvider('eip155');
  const { address, isConnected } = useAppKitAccount();

  const signer = useMemo(() => {
    if (!walletProvider || !isConnected) return null;
    const provider = new BrowserProvider(walletProvider);
    return provider.getSigner();
  }, [walletProvider, isConnected]);

  return {
    address,
    isConnected,
    signer,
  };
}
```

## FHE Client Setup

```typescript
// src/hooks/useFhevmClient.ts
import { useState, useEffect } from 'react';
import { useFhevmClient as useRemoteClient } from 'fhevm-sdk';
import { useWallet } from './useWallet';

export function useFhevmClient({ contractAddress, contractAbi, contractName, relayerBaseUrl }) {
  const { signer, address, isConnected } = useWallet();
  const [client, setClient] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!signer || !isConnected || !contractAddress) {
      setClient(null);
      setIsReady(false);
      return;
    }

    let cancelled = false;

    createFheClient({
      contract: {
        address: contractAddress,
        abi: contractAbi,
        name: contractName,
      },
      mode: 'remote',
      signer,
      relayerBaseUrl,
    })
      .then(newClient => {
        if (!cancelled) {
          setClient(newClient);
          setIsReady(true);
        }
      })
      .catch(err => {
        console.error('Failed to create FHE client:', err);
        if (!cancelled) {
          setIsReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [signer, isConnected, contractAddress, contractAbi, contractName, relayerBaseUrl]);

  return { client, isReady };
}
```

## React Native Component

```typescript
// App.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFhevmClient } from './hooks/useFhevmClient';
import { useRemoteFheCounter } from 'fhevm-sdk';
import { WalletButton } from './components/WalletButton';

export default function App() {
  const { client, isReady } = useFhevmClient({
    contractAddress: '0xYourContractAddress',
    contractAbi: [...], // Your contract ABI
    contractName: 'FHECounter',
    relayerBaseUrl: 'http://10.0.2.2:4000', // Android emulator
  });

  const { value, increment, decrement, refresh, isMutating } = useRemoteFheCounter({
    client,
  });

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text>Loading FHE Client...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WalletButton />

      <Text style={styles.title}>Encrypted Counter</Text>

      <View style={styles.countDisplay}>
        <Text style={styles.count}>{value ?? 'Loading...'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isMutating && styles.buttonDisabled]}
        onPress={increment}
        disabled={isMutating}
      >
        <Text style={styles.buttonText}>
          {isMutating ? 'Processing...' : '+ Increment'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isMutating && styles.buttonDisabled]}
        onPress={decrement}
        disabled={isMutating}
      >
        <Text style={styles.buttonText}>
          {isMutating ? 'Processing...' : '- Decrement'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={refresh}
        disabled={isMutating}
      >
        <Text style={styles.buttonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  countDisplay: {
    alignItems: 'center',
    marginVertical: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  count: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#007bff',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

## Relayer Configuration

### Android Emulator
```typescript
relayerBaseUrl: 'http://10.0.2.2:4000'
```

### iOS Simulator
```typescript
relayerBaseUrl: 'http://localhost:4000'
```

### Physical Device
```typescript
relayerBaseUrl: 'http://192.168.1.100:4000' // Your computer's local IP
```

## Remote Mode Benefits

Remote mode is required for React Native because:

1. **No WASM Support**: React Native doesn't support SharedArrayBuffer
2. **Faster Initialization**: No need to load cryptographic libraries
3. **Smaller Bundle**: Client only handles HTTP requests
4. **Better Performance**: Server-side encryption/decryption
5. **Lower Memory**: No FHE operations on device

## Metro Configuration

React Native uses Metro bundler. Configure it to handle the monorepo:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch all files in the monorepo
config.watchFolders = [path.resolve(__dirname, '../..')];

// Resolve fhevm-sdk from the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

// Mock web-only dependencies
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@reown/appkit/react') {
    return { type: 'empty' };
  }
  if (moduleName === 'wagmi') {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

## Key Differences from Web

| Feature | Web (Next.js) | React Native |
|---------|---------------|--------------|
| FHE Mode | Local | Remote (relayer) |
| WASM | Loaded client-side | Not used |
| Wallet | Rainbow Kit | Reown AppKit |
| Hooks | All hooks | Remote hooks only |
| Bundle Size | Larger | Smaller |

## Troubleshooting

### Relayer Connection Failed
- Check relayer is running: `pnpm relayer:dev`
- Use correct URL for platform (see above)
- Check firewall settings

### Module Not Found
- Run `pnpm install` in both root and react-native package
- Clear Metro cache: `npx expo start --clear`

### Signature Verification Failed
- Ensure signer is properly initialized
- Check that wallet is connected
- Verify network is correct

## Next Steps

- Review the complete React Native app in `packages/react-native/App.tsx`
- Learn about [useRemoteFheCounter](../hooks/overview.md)
- Explore the Relayer Service in `packages/relayer-service/`
