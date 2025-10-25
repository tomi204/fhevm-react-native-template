import { ethers } from "ethers";

type AbiFragment = Record<string, unknown>;

const DEFAULT_RELAYER_BASE_URL = "https://relayer.zama.ai";

type Fetcher = <T>(path: string, body: unknown) => Promise<T>;

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
    const payload = await response.json().catch(() => ({}));
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
  const sessionPayload = await fetcher<{ sessionId: string; nonce: number }>("/v1/sessions", {
    contractAddress: options.contractAddress,
    abi: options.abi,
    userAddress: await options.signer.getAddress(),
  });
  const sessionId = sessionPayload.sessionId;
  let nonce = sessionPayload.nonce ?? 0;

  const remoteResponse = {
    sessionId,
    baseUrl,
    headers,
    signer: options.signer,
    nonce,
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
    mutate: ({ functionName, values }) =>
      signedPost<{ txHash: string; blockNumber: number; nextNonce?: number }>("/v1/fhe/mutate", {
        functionName,
        values,
      }).then(payload => ({ txHash: payload.txHash, blockNumber: payload.blockNumber })),
  };
};
