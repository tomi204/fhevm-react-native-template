---
sidebar_position: 3
---

# Client API

API reference for creating and using FHE clients.

## createFheClient

Create a unified FHE client for local or remote mode.

### Signature

```typescript
function createFheClient(
  options: CreateFheClientOptions
): Promise<FheClient>
```

### Parameters

```typescript
type CreateFheClientOptions = {
  contract: {
    address: `0x${string}`;
    abi: Abi;
  };
} & (LocalModeConfig | RemoteModeConfig);

type LocalModeConfig = {
  mode: "local";
  provider: string | Eip1193Provider;
  signer: ethers.Signer;
  chainId?: number;
  mockChains?: Record<number, string>;
};

type RemoteModeConfig = {
  mode?: "remote";
  signer: ethers.Signer;
  relayer?: {
    baseUrl?: string;
    apiKey?: string;
  };
};
```

### Return Value

```typescript
type FheClient = {
  mode: "remote" | "local";
  contract: FheContractConfig;
  read: (functionName?: string) => Promise<{ handle: string; value: string }>;
  mutate: (params: { functionName: string; values: number[] }) => Promise<{ txHash: string; blockNumber: number }>;
  metadata?: {
    relayerBaseUrl?: string;
    sessionId?: string;
  };
  [Symbol.asyncDispose]?: () => Promise<void>;
};
```

### Example (Local Mode)

```typescript
import { createFheClient } from '@fhevm/sdk';
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const client = await createFheClient({
  mode: "local",
  provider: window.ethereum,
  signer,
  contract: {
    address: "0x123...",
    abi: counterAbi,
  },
});

// Read
const { handle, value } = await client.read("getCount");
console.log("Count:", value);

// Mutate
const { txHash } = await client.mutate({
  functionName: "increment",
  values: [1],
});
console.log("Transaction:", txHash);
```

### Example (Remote Mode)

```typescript
const client = await createFheClient({
  mode: "remote",
  signer,
  relayer: {
    baseUrl: "https://relayer.zama.ai",
    apiKey: "your-api-key",
  },
  contract: {
    address: "0x123...",
    abi: counterAbi,
  },
});

// Same API as local mode
const { value } = await client.read("getCount");
```

## createFhevmInstance

Create an FHEVM instance for encryption/decryption.

### Signature

```typescript
function createFhevmInstance(options: {
  provider: string | Eip1193Provider;
  mockChains?: Record<number, string>;
  signal?: AbortSignal;
  onStatusChange?: (status: string) => void;
}): Promise<FhevmInstance>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | `string \| Eip1193Provider` | Yes | Provider or RPC URL |
| `mockChains` | `Record<number, string>` | No | Mock chain configurations |
| `signal` | `AbortSignal` | No | Abort signal for cancellation |
| `onStatusChange` | `(status: string) => void` | No | Status change callback |

### Example

```typescript
import { createFhevmInstance } from '@fhevm/sdk';

const instance = await createFhevmInstance({
  provider: window.ethereum,
  mockChains: {
    31337: "http://localhost:8545",
  },
  onStatusChange: (status) => {
    console.log("Status:", status);
  },
});

// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(100);
const encrypted = await input.encrypt();

// Decrypt value
const results = await instance.userDecrypt(
  [{ handle, contractAddress }],
  privateKey,
  publicKey,
  signature,
  contractAddresses,
  userAddress,
  startTimestamp,
  durationDays
);
```

## FhevmDecryptionSignature

Manage decryption permission signatures.

### loadOrSign

Load cached signature or create new one:

```typescript
static async loadOrSign(
  instance: FhevmInstance,
  contractAddresses: string[],
  signer: ethers.Signer,
  storage: GenericStringStorage,
  keyPair?: { publicKey: string; privateKey: string }
): Promise<FhevmDecryptionSignature | null>
```

### Example

```typescript
import { FhevmDecryptionSignature, GenericStringInMemoryStorage } from '@fhevm/sdk';

const storage = new GenericStringInMemoryStorage();

const signature = await FhevmDecryptionSignature.loadOrSign(
  instance,
  ["0x123..."],
  signer,
  storage
);

if (signature) {
  // Use signature for decryption
  const results = await instance.userDecrypt(
    [{ handle, contractAddress }],
    signature.privateKey,
    signature.publicKey,
    signature.signature,
    signature.contractAddresses,
    signature.userAddress,
    signature.startTimestamp,
    signature.durationDays
  );
}
```

### new

Create new signature:

```typescript
static async new(
  instance: FhevmInstance,
  contractAddresses: string[],
  publicKey: string,
  privateKey: string,
  signer: ethers.Signer
): Promise<FhevmDecryptionSignature | null>
```

### Methods

#### isValid

Check if signature is still valid:

```typescript
signature.isValid(): boolean
```

#### toJSON

Serialize to JSON:

```typescript
signature.toJSON(): FhevmDecryptionSignatureType
```

#### fromJSON

Deserialize from JSON:

```typescript
static fromJSON(json: unknown): FhevmDecryptionSignature
```

#### saveToGenericStringStorage

Save to storage:

```typescript
async saveToGenericStringStorage(
  storage: GenericStringStorage,
  instance: FhevmInstance,
  withPublicKey: boolean
): Promise<void>
```

#### loadFromGenericStringStorage

Load from storage:

```typescript
static async loadFromGenericStringStorage(
  storage: GenericStringStorage,
  instance: FhevmInstance,
  contractAddresses: string[],
  userAddress: string,
  publicKey?: string
): Promise<FhevmDecryptionSignature | null>
```

## Helper Functions

### getEncryptionMethod

Map ABI type to encryption method:

```typescript
function getEncryptionMethod(internalType: string): string
```

Example:

```typescript
import { getEncryptionMethod } from '@fhevm/sdk';

const method = getEncryptionMethod("externalEuint64");
// Returns: "add64"
```

### buildParamsFromAbi

Build contract parameters from encrypted result:

```typescript
function buildParamsFromAbi(
  enc: EncryptResult,
  abi: any[],
  functionName: string,
  originalArgs?: any[]
): any[]
```

Example:

```typescript
import { buildParamsFromAbi } from '@fhevm/sdk';

const finalArgs = buildParamsFromAbi(
  encrypted,
  contractAbi,
  "transfer",
  [recipient, amount]
);
```

### toHex

Convert Uint8Array to hex string:

```typescript
function toHex(value: Uint8Array | string): `0x${string}`
```

## Next Steps

- Review [Types Reference](./types.md)
- Explore [Hooks API](./hooks.md)
- Check [Storage API](./storage.md)
