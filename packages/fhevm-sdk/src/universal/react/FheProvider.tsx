import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createFheClient } from "../createFheClient.js";
import type { CreateFheClientOptions, FheClient } from "../types.js";

export type FheProviderProps = {
  children: ReactNode;
  client?: FheClient;
  config?: CreateFheClientOptions;
  clientFactory?: () => Promise<FheClient>;
};

export type FheContextValue = {
  client: FheClient | undefined;
  status: "idle" | "connecting" | "ready" | "error";
  error: Error | undefined;
  refresh: () => Promise<void>;
};

const FheContext = createContext<FheContextValue | undefined>(undefined);

const buildFactory = (
  config?: CreateFheClientOptions,
  clientFactory?: () => Promise<FheClient>,
): (() => Promise<FheClient>) | undefined => {
  if (clientFactory) return clientFactory;
  if (config) {
    return () => createFheClient(config);
  }
  return undefined;
};

export const FheProvider = ({ children, client, config, clientFactory }: FheProviderProps) => {
  const initialFactory = buildFactory(config, clientFactory);
  const [factory, setFactory] = useState<typeof initialFactory>(initialFactory);
  const [currentClient, setCurrentClient] = useState<FheClient | undefined>(client);
  const [status, setStatus] = useState<FheContextValue["status"]>(client ? "ready" : factory ? "connecting" : "idle");
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    setFactory(buildFactory(config, clientFactory));
  }, [config, clientFactory]);

  const loadClient = useCallback(async () => {
    if (!factory) return;
    setStatus("connecting");
    setError(undefined);
    try {
      const built = await factory();
      setCurrentClient(built);
      setStatus("ready");
    } catch (err) {
      setError(err as Error);
      setStatus("error");
    }
  }, [factory]);

  useEffect(() => {
    if (client) {
      setCurrentClient(client);
      setStatus("ready");
      setError(undefined);
      return;
    }
    if (factory) {
      void loadClient();
    }
  }, [client, factory, loadClient]);

  const refresh = useCallback(async () => {
    await loadClient();
  }, [loadClient]);

  const value = useMemo<FheContextValue>(
    () => ({
      client: currentClient,
      status,
      error,
      refresh,
    }),
    [currentClient, status, error, refresh],
  );

  return <FheContext.Provider value={value}>{children}</FheContext.Provider>;
};

export const useFheClient = () => {
  const ctx = useContext(FheContext);
  if (!ctx) {
    throw new Error("useFheClient must be used within a FheProvider");
  }
  return ctx;
};
