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
} from "@fhevm-sdk";

type AbiFragment = Record<string, unknown>;

type SessionConfig = {
  id: string;
  contractAddress: `0x${string}`;
  abi: AbiFragment[];
  contract: ethers.Contract;
};

const envSchema = z.object({
  RPC_URL: z.string(),
  PRIVATE_KEY: z.string().min(10, "PRIVATE_KEY must be defined"),
  PORT: z.coerce.number().default(4000),
  RELAYER_API_KEYS: z.string().optional(),
  CHAIN_ID: z.coerce.number().default(11155111), // Sepolia by default
});

const env = envSchema.parse(process.env);
const apiKeys = env.RELAYER_API_KEYS?.split(",").map(item => item.trim()).filter(Boolean) ?? null;

const provider = new ethers.JsonRpcProvider(env.RPC_URL);
const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);

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

function storeSession(contractAddress: `0x${string}`, abi: AbiFragment[]) {
  const id = randomUUID();
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  const session: SessionConfig = { id, contractAddress, abi, contract };
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

async function decryptHandle(handle: string, contractAddress: `0x${string}`) {
  if (handle === ethers.ZeroHash) return BigInt(0);
  const instance = await getInstance();
  const sig = await FhevmDecryptionSignature.loadOrSign(
    instance,
    [contractAddress],
    wallet as any,
    decryptStorage,
  );
  if (!sig) throw new Error("Unable to prepare FHE decryption signature");
  const results = await instance.userDecrypt(
    [{ handle, contractAddress }],
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
  if (fnAbi.inputs.length !== values.length) {
    throw new Error(`Function ${functionName} expects ${fnAbi.inputs.length} inputs but got ${values.length}`);
  }

  const instance = await getInstance();
  const input = instance.createEncryptedInput(session.contractAddress, wallet.address);
  fnAbi.inputs.forEach((inputParam, index) => {
    const method = getEncryptionMethod(inputParam.internalType ?? "externalEuint32");
    (input as any)[method](values[index]);
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
  label: z.string().optional(),
});

app.post("/v1/sessions", (req, res) => {
  if (!authenticate(req, res)) return;
  const { contractAddress, abi } = sessionSchema.parse(req.body);
  const session = storeSession(contractAddress as `0x${string}`, abi);
  res.json({
    sessionId: session.id,
    chainId: env.CHAIN_ID,
  });
});

const readSchema = z.object({
  sessionId: z.string().uuid(),
  functionName: z.string().default("getCount"),
});

app.post("/v1/fhe/read", async (req, res, next) => {
  if (!authenticate(req, res)) return;
  try {
    const { sessionId, functionName } = readSchema.parse(req.body);
    const session = getSession(sessionId);
    const handle: string = await session.contract[functionName]();
    const value = await decryptHandle(handle, session.contractAddress);
    res.json({
      handle,
      value: value.toString(),
    });
  } catch (error) {
    next(error);
  }
});

const mutateSchema = z.object({
  sessionId: z.string().uuid(),
  functionName: z.string(),
  values: z.array(z.number()).default([]),
});

app.post("/v1/fhe/mutate", async (req, res, next) => {
  if (!authenticate(req, res)) return;
  try {
    const { sessionId, functionName, values } = mutateSchema.parse(req.body);
    const session = getSession(sessionId);
    const params = await encryptArgs(session, functionName, values);
    const tx = await session.contract[functionName](...params);
    const receipt = await tx.wait();
    res.json({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    next(error);
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(`FHEVM relayer service ready on http://localhost:${env.PORT} (Sepolia)`); 
});
