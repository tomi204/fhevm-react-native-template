import { ethers } from "ethers";
import { createRemoteFheClient } from "../remote/index.js";
import {
  buildParamsFromAbi,
  getEncryptionMethod,
  FhevmDecryptionSignature,
  GenericStringInMemoryStorage,
  createFhevmInstance,
} from "../index.js";
import type { CreateFheClientOptions, FheClient, LocalController, RemoteController } from "./types.js";

const decryptStorage = new GenericStringInMemoryStorage();

const withRemoteMode = async (options: CreateFheClientOptions & { mode?: "remote" }): Promise<FheClient> => {
  if (!options.signer) {
    throw new Error("Remote mode requires a signer to authorize requests.");
  }
  const remote = await createRemoteFheClient({
    contractAddress: options.contract.address,
    abi: options.contract.abi as any[],
    baseUrl: options.relayer?.baseUrl,
    apiKey: options.relayer?.apiKey,
    signer: options.signer,
  });

  const controller: RemoteController = { remote };

  return {
    mode: "remote",
    contract: options.contract,
    metadata: {
      relayerBaseUrl: remote.baseUrl,
      sessionId: remote.sessionId,
    },
    read: function (functionName = "getCount") {
      return controller.remote.read(functionName);
    },
    mutate: function ({ functionName, values }) {
      return controller.remote.mutate({ functionName, values });
    },
  };
};

const withLocalMode = async (options: CreateFheClientOptions & { mode: "local" }): Promise<FheClient> => {
  const signer = options.signer;
  const contract = new ethers.Contract(options.contract.address, options.contract.abi, signer);
  const controller = new AbortController();
  const instancePromise = createFhevmInstance({
    provider: options.provider,
    chainId: options.chainId,
    mockChains: options.mockChains,
    signal: controller.signal,
  });
  const getInstance = async () => instancePromise;

  const controller: LocalController = {
    getInstance,
    signer,
    contract,
  };

  const decryptHandle = async (handle: string) => {
    if (handle === ethers.ZeroHash) return "0";
    const instance = await controller.getInstance();
    const sig = await FhevmDecryptionSignature.loadOrSign(
      instance,
      [options.contract.address],
      controller.signer,
      decryptStorage,
    );
    if (!sig) throw new Error("Unable to create FHE signature");
    const results = await instance.userDecrypt(
      [{ handle, contractAddress: options.contract.address }],
      sig.privateKey,
      sig.publicKey,
      sig.signature,
      sig.contractAddresses,
      sig.userAddress,
      sig.startTimestamp,
      sig.durationDays,
    );
    const clear = results[handle];
    if (typeof clear === "undefined") throw new Error("Empty decrypt result");
    return clear.toString();
  };

  const encryptArgs = async (functionName: string, values: number[]) => {
    const fnAbi = options.contract.abi.find(item => (item as any).name === functionName) as {
      inputs?: { internalType?: string }[];
    } | null;
    if (!fnAbi || !fnAbi.inputs) throw new Error(`Function ${functionName} not found in ABI`);
    const instance = await controller.getInstance();
    const input = instance.createEncryptedInput(options.contract.address, await controller.signer.getAddress());
    fnAbi.inputs.forEach((inputParam, index) => {
      const method = getEncryptionMethod(inputParam.internalType ?? "externalEuint32");
      (input as any)[method](values[index] ?? 0);
    });
    const encrypted = await input.encrypt();
    return buildParamsFromAbi(encrypted, options.contract.abi as any[], functionName);
  };

  return {
    mode: "local",
    contract: options.contract,
    read: async (functionName = "getCount") => {
      const handle: string = await controller.contract[functionName]();
      const value = await decryptHandle(handle);
      return { handle, value };
    },
    mutate: async ({ functionName, values }) => {
      const args = await encryptArgs(functionName, values);
      const tx = await controller.contract[functionName](...args);
      const receipt = await tx.wait();
      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    },
    metadata: {},
  };
};

export const createFheClient = async (options: CreateFheClientOptions): Promise<FheClient> => {
  if (options.mode === "local") {
    return withLocalMode(options);
  }
  return withRemoteMode(options);
};
