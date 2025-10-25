type AbiFragment = Record<string, unknown>;

const DEFAULT_RELAYER_BASE_URL = "https://relayer.zama.ai";

type Fetcher = <T>(path: string, body: unknown) => Promise<T>;

export type RemoteFheClientOptions = {
  contractAddress: `0x${string}`;
  abi: AbiFragment[];
  apiKey?: string;
  baseUrl?: string;
};

export type RemoteFheClient = {
  sessionId: string;
  baseUrl: string;
  headers: Record<string, string>;
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

export const createRemoteFheClient = async (options: RemoteFheClientOptions): Promise<RemoteFheClient> => {
  const baseUrl = options.baseUrl ?? DEFAULT_RELAYER_BASE_URL;
  const headers: Record<string, string> = {};
  if (options.apiKey) headers["x-relayer-key"] = options.apiKey;
  const fetcher = createFetcher(baseUrl, headers);
  const sessionPayload = await fetcher<{ sessionId: string }>("/v1/sessions", {
    contractAddress: options.contractAddress,
    abi: options.abi,
  });
  const sessionId = sessionPayload.sessionId;

  return {
    sessionId,
    baseUrl,
    headers,
    read: (functionName = "getCount") => fetcher("/v1/fhe/read", { sessionId, functionName }),
    mutate: ({ functionName, values }) => fetcher("/v1/fhe/mutate", { sessionId, functionName, values }),
  };
};
