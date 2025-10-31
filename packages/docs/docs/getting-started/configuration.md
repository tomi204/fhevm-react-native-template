---
sidebar_position: 2
---

# Configuration

Learn how to configure the FHEVM SDK for your application, including network setup, contract configuration, and performance optimization.

## Basic Configuration

Create a configuration using the `createConfig` function:

```typescript
import { createConfig } from '@fhevm/sdk';

const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
    },
  ],
});
```

## Configuration Options

### FhevmConfig Type

```typescript
type FhevmConfig = {
  chains: FhevmChainConfig[];
  contracts?: Record<string, ContractConfig>;
  relayer?: {
    baseUrl?: string;
    apiKey?: string;
  };
  defaultMode?: "local" | "remote";
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
};
```

## Chain Configuration

### FhevmChainConfig

Define the blockchain networks your application will connect to:

```typescript
type FhevmChainConfig = {
  id: number;              // Chain ID
  name: string;            // Human-readable name
  rpcUrl: string;          // RPC endpoint URL
  isMock?: boolean;        // Whether this is a mock chain for testing
  contracts?: Record<string, ContractConfig>; // Per-chain contracts
};
```

### Example: Multiple Chains

```typescript
const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
      isMock: false,
    },
    {
      id: 9000,
      name: 'Local Testnet',
      rpcUrl: 'http://localhost:8545',
      isMock: true, // Use mock for local testing
    },
  ],
});
```

### Mock Chains

Mock chains allow you to test your application without real encryption:

```typescript
const config = createConfig({
  chains: [
    {
      id: 31337,
      name: 'Hardhat Local',
      rpcUrl: 'http://localhost:8545',
      isMock: true, // Enables mock mode
    },
  ],
});
```

## Contract Configuration

### Global Contract Configuration

Define contracts that are available across all chains:

```typescript
import { createConfig } from '@fhevm/sdk';
import { myTokenAbi } from './abis';

const config = createConfig({
  chains: [...],
  contracts: {
    myToken: {
      address: '0x123...',
      abi: myTokenAbi,
      name: 'My Token',
    },
  },
});
```

### Per-Chain Contract Configuration

Define contracts specific to each chain:

```typescript
const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
      contracts: {
        myToken: {
          address: '0x123...', // Devnet address
          abi: myTokenAbi,
        },
      },
    },
    {
      id: 1,
      name: 'Mainnet',
      rpcUrl: 'https://mainnet.zama.ai',
      contracts: {
        myToken: {
          address: '0x456...', // Mainnet address (different)
          abi: myTokenAbi,
        },
      },
    },
  ],
});
```

### ContractConfig Type

```typescript
type ContractConfig<TAbi extends Abi = Abi> = {
  address: `0x${string}`;
  abi: TAbi;
  name?: string;
};
```

### Using Configured Contracts

Once configured, reference contracts by name in hooks:

```typescript
import { useReadContract } from '@fhevm/sdk';

function MyComponent() {
  const { data } = useReadContract({
    name: 'myToken', // Reference by name
    functionName: 'balanceOf',
    args: [userAddress],
  });

  return <div>Balance: {data}</div>;
}
```

## Relayer Configuration

Configure the relayer for remote mode operations:

```typescript
const config = createConfig({
  chains: [...],
  relayer: {
    baseUrl: 'https://relayer.zama.ai',
    apiKey: 'your-api-key', // Optional
  },
  defaultMode: 'remote', // Use relayer by default
});
```

### Relayer Options

| Option | Type | Description |
|--------|------|-------------|
| `baseUrl` | `string` | Relayer service URL |
| `apiKey` | `string` | Optional API key for authentication |

### Local vs Remote Mode

- **Local Mode**: Encryption/decryption happens in the browser. Better for privacy, but requires loading the FHEVM WASM module.
- **Remote Mode**: Encryption/decryption happens on a relayer service. Faster initialization, but sends data to a third party.

```typescript
const config = createConfig({
  chains: [...],
  defaultMode: 'local', // or 'remote'
});
```

## Cache Configuration

Configure the decryption cache for better performance:

```typescript
const config = createConfig({
  chains: [...],
  cache: {
    enabled: true,
    ttl: 60000, // Cache lifetime in milliseconds (1 minute)
  },
});
```

### Cache Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable caching |
| `ttl` | `number` | `60000` | Cache time-to-live in milliseconds |

### Cache Behavior

The cache stores decrypted values by:
- Chain ID
- User account
- Contract address
- Handle (encrypted value reference)

When any of these change, the cache is invalidated.

:::tip Performance
Enable caching with a reasonable TTL (30-60 seconds) for better performance. Decryption operations can take several seconds, and caching significantly improves UX.
:::

## Provider Setup

### Basic Provider

```typescript
import { FhevmProvider } from '@fhevm/sdk';

function App() {
  return (
    <FhevmProvider config={config}>
      <YourApp />
    </FhevmProvider>
  );
}
```

### With Initial Chain

Specify an initial chain ID:

```typescript
<FhevmProvider config={config} initialChainId={8009}>
  <YourApp />
</FhevmProvider>
```

## Wallet Integration

### Syncing with Wagmi

```typescript
import { useSyncWithWallet } from '@fhevm/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useMemo } from 'react';

function WalletSync() {
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

  return null;
}
```

### Manual Provider Connection

```typescript
import { useFhevmContext } from '@fhevm/sdk';
import { BrowserProvider } from 'ethers';

function CustomWalletSync() {
  const { updateState } = useFhevmContext();

  useEffect(() => {
    const connect = async () => {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        updateState({
          chainId: Number(network.chainId),
          account: await signer.getAddress(),
          signer,
          provider,
          eip1193Provider: window.ethereum,
        });
      }
    };

    connect();
  }, [updateState]);

  return null;
}
```

## Environment-Specific Configuration

### Development Configuration

```typescript
const devConfig = createConfig({
  chains: [
    {
      id: 31337,
      name: 'Hardhat',
      rpcUrl: 'http://localhost:8545',
      isMock: true,
    },
  ],
  cache: {
    enabled: true,
    ttl: 10000, // Shorter cache for testing
  },
  defaultMode: 'local',
});
```

### Production Configuration

```typescript
const prodConfig = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
      isMock: false,
    },
  ],
  relayer: {
    baseUrl: process.env.NEXT_PUBLIC_RELAYER_URL,
    apiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY,
  },
  cache: {
    enabled: true,
    ttl: 60000,
  },
  defaultMode: 'remote',
});
```

### Dynamic Configuration

```typescript
const config = createConfig({
  chains: [
    {
      id: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
      name: process.env.NEXT_PUBLIC_CHAIN_NAME!,
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
      isMock: process.env.NODE_ENV === 'development',
    },
  ],
  cache: {
    enabled: true,
    ttl: process.env.NODE_ENV === 'production' ? 60000 : 10000,
  },
});
```

## Complete Configuration Example

```typescript
import { createConfig } from '@fhevm/sdk';
import { encryptedERC20Abi, counterAbi } from './abis';

const config = createConfig({
  chains: [
    {
      id: 8009,
      name: 'Zama Devnet',
      rpcUrl: 'https://devnet.zama.ai',
      isMock: false,
      contracts: {
        // Chain-specific contracts
        governance: {
          address: '0x789...',
          abi: governanceAbi,
        },
      },
    },
    {
      id: 31337,
      name: 'Local Testnet',
      rpcUrl: 'http://localhost:8545',
      isMock: true,
    },
  ],
  contracts: {
    // Global contracts
    encryptedToken: {
      address: '0x123...',
      abi: encryptedERC20Abi,
      name: 'Encrypted Token',
    },
    counter: {
      address: '0x456...',
      abi: counterAbi,
      name: 'Counter',
    },
  },
  relayer: {
    baseUrl: process.env.NEXT_PUBLIC_RELAYER_URL,
    apiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY,
  },
  defaultMode: 'local',
  cache: {
    enabled: true,
    ttl: 60000,
  },
});

export default config;
```

## Next Steps

- Learn about [Available Hooks](../hooks/overview.md)
- Understand [Storage Options](../storage/overview.md)
- Explore [Core Concepts](../core/overview.md)

:::warning RPC URLs
Always use HTTPS URLs for production RPC endpoints. HTTP is only acceptable for local development.
:::

:::note Contract Resolution
When using contract names, the SDK first checks per-chain contracts, then falls back to global contracts. This allows you to override global contracts on specific chains.
:::
