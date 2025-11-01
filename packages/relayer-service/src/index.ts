import "dotenv/config";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ethers } from "ethers";
import {
  buildParamsFromAbi,
  createFhevmInstance,
  FhevmDecryptionSignature,
  GenericStringInMemoryStorage,
  getEncryptionMethod,
  type FhevmInstance,
} from "fhevm-sdk";

type AbiFragment = Record<string, unknown>;

type SessionConfig = {
  id: string;
  contractAddress: `0x${string}`;
  abi: AbiFragment[];
  contract: ethers.BaseContract;
  userAddress: `0x${string}`;
  nonce: number;
  userWallet?: ethers.Wallet;
  decryptionSignature?: {
    publicKey: string;
    privateKey: string;
    signature: string;
    contractAddresses: `0x${string}`[];
    userAddress: `0x${string}`;
    startTimestamp: number;
    durationDays: number;
  };
  pendingAuthorization?: {
    keyPair: { publicKey: string; privateKey: string };
    contractAddresses: `0x${string}`[];
    eip712: {
      domain: ethers.TypedDataDomain;
      types: Record<string, Array<{ name: string; type: string }>>;
      primaryType?: string;
      message: Record<string, unknown>;
    };
    startTimestamp: number;
    durationDays: number;
  };
};

const envSchema = z.object({
  RPC_URL: z.string(),
  PORT: z.coerce.number().default(4000),
  RELAYER_API_KEYS: z.string().optional(),
  CHAIN_ID: z.coerce.number().default(11155111),
});

const env = envSchema.parse(process.env);
const apiKeys = env.RELAYER_API_KEYS?.split(",").map(item => item.trim()).filter(Boolean) ?? null;

const provider = new ethers.JsonRpcProvider(env.RPC_URL);
const decryptStorage = new GenericStringInMemoryStorage();
const sessions = new Map<string, SessionConfig>();

let instancePromise: Promise<FhevmInstance> | null = null;
const mockChains = { [env.CHAIN_ID]: env.RPC_URL };

function getInstance() {
  if (!instancePromise) {
    const controller = new AbortController();
    instancePromise = createFhevmInstance({
      provider: env.RPC_URL,
      mockChains,
      signal: controller.signal,
      onStatusChange: status => console.log(`[FHE] ${status}`),
    });
  }
  return instancePromise;
}

function authenticate(req: express.Request, res: express.Response): boolean {
  if (!apiKeys || apiKeys.length === 0) return true;
  const provided = req.header("x-relayer-key");
  if (!provided || !apiKeys.includes(provided)) {
    res.status(401).json({ error: "Invalid API key" });
    return false;
  }
  return true;
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(item => toJsonSafe(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, toJsonSafe(val)]),
    );
  }
  return value;
}

async function createSession(params: {
  contractAddress: `0x${string}`;
  abi: AbiFragment[];
  userAddress: `0x${string}`;
  userPrivateKey?: string;
}) {
  const id = randomUUID();
  const baseContract = new ethers.Contract(params.contractAddress, params.abi, provider);
  const session: SessionConfig = {
    id,
    contractAddress: params.contractAddress,
    abi: params.abi,
    contract: baseContract,
    userAddress: params.userAddress,
    nonce: 0,
  };

  if (params.userPrivateKey) {
    const normalizedKey = params.userPrivateKey.startsWith("0x")
      ? params.userPrivateKey
      : (`0x${params.userPrivateKey}` as `0x${string}`);
    const userWallet = new ethers.Wallet(normalizedKey, provider);
    session.userWallet = userWallet;
    session.contract = baseContract.connect(userWallet);
  }

  if (!session.userWallet) {
    session.pendingAuthorization = await prepareAuthorization(session.contractAddress);
  }

  sessions.set(id, session);
  return session;
}

function getSession(sessionId: string): SessionConfig {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Unknown sessionId ${sessionId}. Call /v1/sessions first.`);
  }
  return session;
}

async function prepareAuthorization(contractAddress: `0x${string}`) {
  const instance = await getInstance();
  const keyPair = (instance as any).generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 365;
  const contractAddresses = [contractAddress] as `0x${string}`[];
  const eip712 = (instance as any).createEIP712(
    keyPair.publicKey,
    contractAddresses,
    startTimestamp,
    durationDays,
  );

  return {
    keyPair,
    contractAddresses,
    startTimestamp,
    durationDays,
    eip712: {
      domain: eip712.domain,
      types: {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      } as Record<string, Array<{ name: string; type: string }>>,
      primaryType: (eip712 as any).primaryType as string | undefined,
      message: eip712.message as Record<string, unknown>,
    },
  };
}

function buildAuthMessage(sessionId: string, functionName: string, values: number[], nonce: number) {
  return `ZAMA_FHE_REQUEST:${sessionId}:${functionName}:${JSON.stringify(values ?? [])}:${nonce}`;
}

function verifyUserSignature(
  session: SessionConfig,
  functionName: string,
  values: number[],
  signature?: string,
  nonce?: number,
) {
  if (!signature || typeof nonce !== "number") {
    throw new Error("Missing signature or nonce");
  }
  if (nonce !== session.nonce) {
    throw new Error("Invalid nonce");
  }
  const message = buildAuthMessage(session.id, functionName, values, nonce);
  const recovered = ethers.verifyMessage(message, signature);
  if (recovered.toLowerCase() !== session.userAddress.toLowerCase()) {
    throw new Error("Signature mismatch");
  }
}

async function ensureDecryptionSignature(session: SessionConfig) {
  if (session.decryptionSignature) {
    return session.decryptionSignature;
  }

  if (session.pendingAuthorization) {
    throw new Error("Session authorization pending. Complete signature challenge first.");
  }

  if (!session.userWallet) {
    throw new Error("Session does not have authorization to decrypt handles");
  }

  const instance = await getInstance();
  const sig = await FhevmDecryptionSignature.loadOrSign(
    instance,
    [session.contractAddress],
    session.userWallet as any,
    decryptStorage,
  );
  if (!sig) throw new Error("Unable to prepare FHE decryption signature");

  session.decryptionSignature = {
    publicKey: sig.publicKey,
    privateKey: sig.privateKey,
    signature: sig.signature,
    contractAddresses: sig.contractAddresses,
    userAddress: sig.userAddress,
    startTimestamp: sig.startTimestamp,
    durationDays: sig.durationDays,
  };

  return session.decryptionSignature;
}

async function decryptHandle(handle: string, session: SessionConfig) {
  if (handle === ethers.ZeroHash) return BigInt(0);
  const instance = await getInstance();

  const sig = await ensureDecryptionSignature(session);

  const results = await instance.userDecrypt(
    [{ handle, contractAddress: session.contractAddress }],
    sig.privateKey,
    sig.publicKey,
    sig.signature,
    sig.contractAddresses,
    sig.userAddress,
    sig.startTimestamp,
    sig.durationDays,
  );
  const clear = results[handle];
  if (typeof clear === "undefined") {
    throw new Error("FHE decrypt returned empty result");
  }
  return BigInt(clear as string | bigint);
}

async function encryptArgs(session: SessionConfig, functionName: string, values: number[]) {
  const fnAbi = session.abi.find(item => item && typeof item === "object" && (item as any).name === functionName) as {
    inputs?: { internalType?: string }[];
  } | undefined;
  if (!fnAbi || !fnAbi.inputs) {
    throw new Error(`Function ${functionName} not found in ABI`);
  }
  if (fnAbi.inputs.length === 0) {
    return [];
  }

  const encryptableInputs = fnAbi.inputs.filter(input =>
    typeof input.internalType === "string" && input.internalType.startsWith("externalEuint"),
  );
  if (encryptableInputs.length !== values.length) {
    throw new Error(
      `Function ${functionName} expects ${encryptableInputs.length} encryptable inputs but got ${values.length}`,
    );
  }

  const instance = await getInstance();
  // Usar la dirección del usuario para encriptar
  const input = instance.createEncryptedInput(session.contractAddress, session.userAddress);
  let valueIndex = 0;
  fnAbi.inputs.forEach(inputParam => {
    if (typeof inputParam.internalType === "string" && inputParam.internalType.startsWith("externalEuint")) {
      const method = getEncryptionMethod(inputParam.internalType);
      (input as any)[method](values[valueIndex]);
      valueIndex += 1;
    }
  });
  const encrypted = await input.encrypt();
  return buildParamsFromAbi(encrypted, session.abi as any[], functionName);
}

const app = express();
app.use(cors());
app.use(express.json());

const sessionSchema = z.object({
  contractAddress: z.string().refine(value => ethers.isAddress(value), "Invalid contract address"),
  abi: z.array(z.record(z.string(), z.unknown())),
  userAddress: z.string().refine(value => ethers.isAddress(value), "Invalid user address"),
  userPrivateKey: z
    .string()
    .min(64, "Invalid private key")
    .optional(),
  label: z.string().optional(),
});

app.post("/v1/sessions", async (req, res) => {
  if (!authenticate(req, res)) return;
  try {
    const { contractAddress, abi, userAddress, userPrivateKey } = sessionSchema.parse(req.body);

    if (userPrivateKey) {
      const key = userPrivateKey.startsWith("0x") ? userPrivateKey : `0x${userPrivateKey}`;
      const tempWallet = new ethers.Wallet(key);
      if (tempWallet.address.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(400).json({ error: "Private key doesn't match user address" });
      }
    }

    const session = await createSession({
      contractAddress: contractAddress as `0x${string}`,
      abi,
      userAddress: userAddress as `0x${string}`,
      userPrivateKey: userPrivateKey,
    });

    console.log(`[Session] Created for ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);

    res.json({
      sessionId: session.id,
      chainId: env.CHAIN_ID,
      nonce: session.nonce,
      status: session.pendingAuthorization ? "pending_signature" : "ready",
      authorization: session.pendingAuthorization
        ? {
            type: "eip712" as const,
            publicKey: session.pendingAuthorization.keyPair.publicKey,
            startTimestamp: session.pendingAuthorization.startTimestamp,
            durationDays: session.pendingAuthorization.durationDays,
            contractAddresses: session.pendingAuthorization.contractAddresses,
            typedData: toJsonSafe(session.pendingAuthorization.eip712),
          }
        : undefined,
    });
  } catch (error: any) {
    console.error("[Session Error]", error);
    res.status(400).json({ error: error.message });
  }
});

const readSchema = z.object({
  sessionId: z.string().uuid(),
  functionName: z.string().default("getCount"),
  signature: z.string().optional(),
  nonce: z.number().optional(),
});

const authorizeSchema = z.object({
  sessionId: z.string().uuid(),
  signature: z.string(),
});

app.post("/v1/sessions/authorize", async (req, res, next) => {
  if (!authenticate(req, res)) return;
  try {
    const { sessionId, signature } = authorizeSchema.parse(req.body);
    const session = getSession(sessionId);

    if (!session.pendingAuthorization) {
      if (session.decryptionSignature) {
        return res.json({ status: "ready", nonce: session.nonce });
      }
      return res.status(400).json({ error: "Session does not require authorization" });
    }

    const pending = session.pendingAuthorization;

    const recovered = ethers.verifyTypedData(
      pending.eip712.domain,
      pending.eip712.types,
      pending.eip712.message,
      signature,
    );

    if (recovered.toLowerCase() !== session.userAddress.toLowerCase()) {
      return res.status(400).json({ error: "Signature mismatch" });
    }

    const fheSignature = FhevmDecryptionSignature.fromJSON({
      publicKey: pending.keyPair.publicKey,
      privateKey: pending.keyPair.privateKey,
      signature,
      contractAddresses: pending.contractAddresses,
      userAddress: session.userAddress,
      startTimestamp: pending.startTimestamp,
      durationDays: pending.durationDays,
      eip712: {
        domain: pending.eip712.domain,
        types: pending.eip712.types,
        primaryType: pending.eip712.primaryType ?? "UserDecryptRequestVerification",
        message: pending.eip712.message,
      },
    });

    session.decryptionSignature = {
      publicKey: fheSignature.publicKey,
      privateKey: fheSignature.privateKey,
      signature: fheSignature.signature,
      contractAddresses: fheSignature.contractAddresses,
      userAddress: fheSignature.userAddress,
      startTimestamp: fheSignature.startTimestamp,
      durationDays: fheSignature.durationDays,
    };
    session.pendingAuthorization = undefined;

    console.log(`[Session] Authorization completed for ${session.userAddress.slice(0, 6)}...`);

    res.json({
      status: "ready",
      nonce: session.nonce,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/v1/fhe/read", async (req, res, next) => {
  if (!authenticate(req, res)) return;
  let session: SessionConfig | null = null;
  let previousNonce = 0;
  try {
    const { sessionId, functionName, signature, nonce } = readSchema.parse(req.body);
    session = getSession(sessionId);
    previousNonce = session.nonce;
    verifyUserSignature(session, functionName, [], signature, nonce);

    console.log(`[Read] ${functionName} for session ${sessionId.slice(0, 8)}...`);

    const handle: string = await session.contract[functionName]();
    const value = await decryptHandle(handle, session);

    console.log(`[Read] Decrypted value: ${value}`);

    const nextNonce = previousNonce + 1;
    session.nonce = nextNonce;

    res.json({
      handle,
      value: value.toString(),
      nextNonce,
    });
  } catch (error) {
    if (session) {
      session.nonce = previousNonce;
    }
    next(error);
  }
});

const mutateSchema = z.object({
  sessionId: z.string().uuid(),
  functionName: z.string(),
  values: z.array(z.number()).default([]),
  signature: z.string().optional(),
  nonce: z.number().optional(),
});

app.post("/v1/fhe/mutate", async (req, res, next) => {
  if (!authenticate(req, res)) return;
  let session: SessionConfig | null = null;
  let previousNonce = 0;
  try {
    const { sessionId, functionName, values, signature, nonce } = mutateSchema.parse(req.body);
    session = getSession(sessionId);
    previousNonce = session.nonce;
    verifyUserSignature(session, functionName, values, signature, nonce);

    console.log(`[Mutate] ${functionName}(${values.join(", ")}) for session ${sessionId.slice(0, 8)}...`);

    const params = await encryptArgs(session, functionName, values);
    const nextNonce = previousNonce + 1;
    if (!session.userWallet) {
      session.nonce = nextNonce;
      res.json({
        mode: "client-sign",
        params,
        nextNonce,
      });
      return;
    }

    const tx = await session.contract[functionName](...params);

    console.log(`[Mutate] Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();

    console.log(`[Mutate] Transaction mined in block ${receipt.blockNumber}`);

    session.nonce = nextNonce;
    res.json({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      nextNonce,
    });
  } catch (error) {
    if (session) {
      session.nonce = previousNonce;
    }
    next(error);
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(`\n🚀 Simple FHEVM Relayer`);
  console.log(`📍 http://localhost:${env.PORT}`);
  console.log(`⛓️  Chain: Sepolia (${env.CHAIN_ID})`);
  console.log(`🔐 Mode: User provides private key\n`);
});
