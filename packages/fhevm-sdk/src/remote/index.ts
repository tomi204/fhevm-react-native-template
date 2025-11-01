import { ethers } from "ethers";

type AbiFragment = Record<string, unknown>;

const DEFAULT_RELAYER_BASE_URL = "https://relayer.zama.ai";

type Fetcher = <T>(path: string, body: unknown) => Promise<T>;

type SessionAuthorization = {
  type: "eip712";
  publicKey: string;
  startTimestamp: number;
  durationDays: number;
  contractAddresses: string[];
  typedData: {
    domain: ethers.TypedDataDomain;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType?: string;
    message: Record<string, unknown>;
  };
};

type SessionResponse =
  | { sessionId: string; nonce: number; status?: "ready"; authorization?: undefined }
  | { sessionId: string; nonce: number; status: "pending_signature"; authorization: SessionAuthorization };

type MutateResponse =
  | { txHash: string; blockNumber: number; nextNonce?: number }
  | { mode: "client-sign"; params: unknown[]; nextNonce?: number };

export type RemoteFheClientOptions = {
  contractAddress: `0x${string}`;
  abi: AbiFragment[];
  signer: ethers.Signer;
  apiKey?: string;
  baseUrl?: string;
};

export type RemoteFheClient = {
  sessionId: string;
  baseUrl: string;
  headers: Record<string, string>;
  signer: ethers.Signer;
  nonce: number;
  contract: ethers.Contract;
  authorizationPublicKey?: string;
  read: (functionName?: string) => Promise<{ handle: string; value: string }>;
  mutate: (params: { functionName: string; values: number[] }) => Promise<{ txHash: string; blockNumber: number }>;
};

function createFetcher(baseUrl: string, headers: Record<string, string>): Fetcher {
  return async function post<T>(path: string, body: unknown) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      const message = typeof payload?.error === "string" ? payload.error : response.statusText;
      throw new Error(message);
    }
    return payload as T;
  };
}

function buildAuthMessage(sessionId: string, functionName: string, values: number[], nonce: number) {
  return `ZAMA_FHE_REQUEST:${sessionId}:${functionName}:${JSON.stringify(values ?? [])}:${nonce}`;
}

export const createRemoteFheClient = async (options: RemoteFheClientOptions): Promise<RemoteFheClient> => {
  const baseUrl = options.baseUrl ?? DEFAULT_RELAYER_BASE_URL;
  const headers: Record<string, string> = {};
  if (options.apiKey) headers["x-relayer-key"] = options.apiKey;
  const fetcher = createFetcher(baseUrl, headers);
  const contract = new ethers.Contract(options.contractAddress, options.abi as ethers.InterfaceAbi, options.signer);
  const userAddress = await options.signer.getAddress();
  const sessionPayload = await fetcher<SessionResponse>("/v1/sessions", {
    contractAddress: options.contractAddress,
    abi: options.abi,
    userAddress,
  });
  const sessionId = sessionPayload.sessionId;
  let nonce = sessionPayload.nonce ?? 0;

  if (sessionPayload.authorization?.type === "eip712") {
    const signerAny = options.signer as any;
    if (typeof signerAny.signTypedData !== "function") {
      throw new Error("Signer does not support signTypedData required for FHE relayer authorization");
    }
    const typedData = sessionPayload.authorization.typedData;
    const signature = await signerAny.signTypedData(typedData.domain, typedData.types, typedData.message);
    const authorizeResponse = await fetcher<{ status: string; nonce: number }>("/v1/sessions/authorize", {
      sessionId,
      signature,
    });
    nonce = authorizeResponse.nonce ?? nonce;
  }

  const remoteResponse = {
    sessionId,
    baseUrl,
    headers,
    signer: options.signer,
    nonce,
    contract,
    authorizationPublicKey: sessionPayload.authorization?.publicKey,
  } as RemoteFheClient;

  const signedPost = async <T>(path: string, payload: { functionName: string; values: number[] }) => {
    const message = buildAuthMessage(sessionId, payload.functionName, payload.values, nonce);
    const signature = await options.signer.signMessage(message);
    const response = await fetcher<T>(path, {
      sessionId,
      functionName: payload.functionName,
      values: payload.values,
      signature,
      nonce,
    });
    if ((response as any)?.nextNonce !== undefined) {
      nonce = (response as any).nextNonce;
    } else {
      nonce += 1;
    }
    remoteResponse.nonce = nonce;
    return response;
  };
  return {
    ...remoteResponse,
    read: (functionName = "getCount") =>
      signedPost<{ handle: string; value: string; nextNonce?: number }>("/v1/fhe/read", {
        functionName,
        values: [],
      }).then(payload => ({ handle: payload.handle, value: payload.value })),
    mutate: async ({ functionName, values }) => {
      const payload = await signedPost<MutateResponse>("/v1/fhe/mutate", {
        functionName,
        values,
      });

      if ("txHash" in payload) {
        return { txHash: payload.txHash, blockNumber: payload.blockNumber };
      }

      if (payload.mode === "client-sign") {
        const contractFn = (remoteResponse.contract as any)[functionName];
        if (typeof contractFn !== "function") {
          throw new Error(`Contract does not expose function ${functionName}`);
        }
        const tx = await contractFn(...(payload.params as unknown[]));
        const receipt = await tx.wait();
        return { txHash: tx.hash, blockNumber: receipt.blockNumber };
      }

      throw new Error("Unexpected response from relayer mutate endpoint");
    },
  };
};
