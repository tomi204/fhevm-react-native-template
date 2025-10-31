---
sidebar_position: 2
---

# Types Reference

Complete TypeScript type reference for the FHEVM SDK.

## Configuration Types

### FhevmConfig

Main configuration object:

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

### FhevmChainConfig

Chain configuration:

```typescript
type FhevmChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  isMock?: boolean;
  contracts?: Record<string, ContractConfig>;
};
```

### ContractConfig

Contract configuration:

```typescript
type ContractConfig<TAbi extends Abi = Abi> = {
  address: `0x${string}`;
  abi: TAbi;
  name?: string;
};
```

### FhevmState

Provider state:

```typescript
type FhevmState = {
  config: FhevmConfig;
  chainId?: number;
  account?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
  eip1193Provider?: any;
};
```

## FHEVM Types

### FhevmInstance

Core encryption engine (from @zama-fhe/relayer-sdk):

```typescript
type FhevmInstance = {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  userDecrypt(
    requests: HandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<DecryptedResults>;
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
};
```

### FhevmDecryptionSignatureType

Decryption permission signature:

```typescript
type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};
```

### EIP712Type

EIP-712 typed data:

```typescript
type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};
```

### HandleContractPair

Decryption request:

```typescript
type HandleContractPair = {
  handle: string;
  contractAddress: `0x${string}`;
};
```

### DecryptedResults

Decryption results:

```typescript
type DecryptedResults = Record<string, string | bigint | boolean>;
```

## Cache Types

### DecryptCache

Cached decrypted value:

```typescript
type DecryptCache = {
  value: string | bigint | boolean;
  timestamp: number;
  chainId: number;
  account: string;
};
```

### DecryptCacheStore

Cache storage:

```typescript
type DecryptCacheStore = Map<string, DecryptCache>;
```

## Client Types

### FheClient

Unified FHE client:

```typescript
type FheClient = {
  mode: "remote" | "local";
  contract: FheContractConfig;
  read: (functionName?: string) => Promise<FheClientReadResponse>;
  mutate: (params: { functionName: string; values: number[] }) => Promise<FheClientMutateResponse>;
  metadata?: {
    relayerBaseUrl?: string;
    sessionId?: string;
  };
  [Symbol.asyncDispose]?: () => Promise<void>;
};
```

### FheClientReadResponse

Read response:

```typescript
type FheClientReadResponse = {
  handle: string;
  value: string;
};
```

### FheClientMutateResponse

Mutate response:

```typescript
type FheClientMutateResponse = {
  txHash: string;
  blockNumber: number;
};
```

### CreateFheClientOptions

Client creation options:

```typescript
type CreateFheClientOptions = {
  contract: FheContractConfig;
} & (RemoteModeConfig | LocalModeConfig);

type RemoteModeConfig = {
  mode?: "remote";
  signer: ethers.Signer;
  relayer?: {
    baseUrl?: string;
    apiKey?: string;
  };
};

type LocalModeConfig = {
  mode: "local";
  provider: string | Eip1193Provider;
  signer: ethers.Signer;
  chainId?: number;
  mockChains?: Record<number, string>;
};
```

## Hook Types

### UseContractParameters

```typescript
type UseContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  mode?: "read" | "write";
};
```

### UseContractReturnType

```typescript
type UseContractReturnType<TAbi extends Abi = Abi> = {
  contract: ethers.Contract | undefined;
  address: `0x${string}` | undefined;
  abi: TAbi | undefined;
  isReady: boolean;
};
```

### UseReadContractParameters

```typescript
type UseReadContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
  functionName: string;
  args?: any[];
  enabled?: boolean;
  watch?: boolean;
  decrypt?: boolean;
};
```

### UseReadContractReturnType

```typescript
type UseReadContractReturnType = {
  data: any;
  encryptedData: string | undefined;
  decryptedData: string | bigint | boolean | undefined;
  isLoading: boolean;
  isDecrypting: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};
```

### UseWriteContractParameters

```typescript
type UseWriteContractParameters<TAbi extends Abi = Abi> = {
  address?: `0x${string}`;
  abi?: TAbi;
  name?: string;
};
```

### WriteContractArgs

```typescript
type WriteContractArgs = {
  functionName: string;
  args?: any[];
  value?: bigint;
  gasLimit?: bigint;
};
```

### UseWriteContractReturnType

```typescript
type UseWriteContractReturnType = {
  write: (args: WriteContractArgs) => Promise<TransactionReceipt | undefined>;
  writeAsync: (args: WriteContractArgs) => Promise<TransactionReceipt | undefined>;
  data: TransactionReceipt | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};
```

## Storage Types

### GenericStringStorage

Storage interface:

```typescript
interface GenericStringStorage {
  getItem(key: string): string | Promise<string | null> | null;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

## Encryption Types

### EncryptResult

Encryption result:

```typescript
type EncryptResult = {
  handles: Uint8Array[];
  inputProof: Uint8Array;
};
```

## Utility Types

### FhevmGoState

Instance loading state:

```typescript
type FhevmGoState = "idle" | "loading" | "ready" | "error";
```

## Type Guards

### Checking Types

```typescript
import { FhevmDecryptionSignature } from '@fhevm/sdk';

// Check if object is a valid signature
const isValid = FhevmDecryptionSignature.checkIs(obj);
```

## Generic Type Parameters

### TAbi

Contract ABI type parameter:

```typescript
import type { Abi } from 'abitype';

type MyAbi = [...] as const;

// Use in hooks
const { data } = useReadContract<MyAbi>({
  abi: myAbi,
  functionName: 'getData',
});
```

## Next Steps

- Review [Configuration API](../getting-started/configuration)
- Explore [Hooks API](./hooks.md)
- Check [Storage API](./storage.md)
