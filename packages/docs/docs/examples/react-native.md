---
sidebar_position: 4
---

# React Native

Using the FHEVM SDK in React Native applications with WalletConnect/Reown.

## Installation

```bash
npm install @fhevm/sdk ethers
npm install @reown/appkit-react-native @reown/appkit-wagmi-react-native
```

## Configuration

```typescript
// config.ts
import { createConfig } from '@fhevm/sdk';

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
    },
  ],
  defaultMode: 'remote', // Use remote mode for mobile
  relayer: {
    baseUrl: 'https://relayer.zama.ai',
  },
  cache: {
    enabled: true,
    ttl: 60000,
  },
});
```

## App Setup

```typescript
// App.tsx
import { FhevmProvider } from '@fhevm/sdk';
import { WagmiProvider } from 'wagmi';
import { fhevmConfig } from './config';
import { wagmiConfig } from './wagmi';
import { Counter } from './Counter';

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <FhevmProvider config={fhevmConfig}>
        <Counter />
      </FhevmProvider>
    </WagmiProvider>
  );
}
```

## Wallet Connection

```typescript
import { useAccount, useWalletClient } from 'wagmi';
import { useSyncWithWallet } from '@fhevm/sdk';
import { useMemo } from 'react';
import { BrowserProvider } from 'ethers';

export function useWalletSync() {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const ethersSigner = useMemo(() => {
    if (!walletClient) return undefined;
    const provider = new BrowserProvider(walletClient);
    return provider.getSigner();
  }, [walletClient]);

  useSyncWithWallet({
    address,
    chainId,
    signer: ethersSigner,
  });
}
```

## React Native Component

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useReadContract, useWriteContract } from '@fhevm/sdk';
import { useAccount } from 'wagmi';

export function Counter() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('1');

  const { decryptedData, isLoading, isDecrypting, refetch } = useReadContract({
    name: 'counter',
    functionName: 'getCount',
    decrypt: true,
  });

  const { write, isLoading: isWriting } = useWriteContract({
    name: 'counter',
  });

  const handleIncrement = async () => {
    await write({
      functionName: 'increment',
      args: [BigInt(amount)],
    });
    setTimeout(() => refetch(), 2000);
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text>Please connect your wallet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encrypted Counter</Text>

      <View style={styles.countDisplay}>
        {isLoading || isDecrypting ? (
          <Text>Loading...</Text>
        ) : (
          <Text style={styles.count}>{decryptedData?.toString() || '0'}</Text>
        )}
      </View>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        editable={!isWriting}
      />

      <TouchableOpacity
        style={[styles.button, isWriting && styles.buttonDisabled]}
        onPress={handleIncrement}
        disabled={isWriting}
      >
        <Text style={styles.buttonText}>
          {isWriting ? 'Processing...' : 'Increment'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => refetch()}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  countDisplay: {
    alignItems: 'center',
    marginVertical: 30,
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
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

## Remote Mode Benefits

Remote mode is recommended for React Native:

1. **Faster Initialization**: No WASM loading
2. **Smaller Bundle**: No cryptographic libraries
3. **Better Performance**: Server-side processing
4. **Lower Memory**: Reduced mobile resource usage

## Considerations

### Platform Support

- iOS: Fully supported
- Android: Fully supported
- Both platforms work with remote mode

### Storage

Use AsyncStorage for persistent signature caching:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GenericStringStorage } from '@fhevm/sdk';

class AsyncStorageAdapter implements GenericStringStorage {
  async getItem(key: string) {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  }
}
```

### Performance

- Use remote mode for best mobile performance
- Enable caching to reduce network requests
- Minimize decryption operations

## Next Steps

- Review [Basic Usage](./basic-usage.md)
- Learn about [Configuration](../getting-started/configuration.md)
- Explore [Storage Options](../storage/overview.md)
