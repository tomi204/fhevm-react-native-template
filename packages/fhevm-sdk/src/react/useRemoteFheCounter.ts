import { useCallback, useEffect, useMemo, useState } from "react";
import type { RemoteFheClient } from "../remote/index.js";

export const useRemoteFheCounter = (parameters: {
  client: RemoteFheClient | undefined;
  readFunctionName?: string;
  incrementFunctionName?: string;
  decrementFunctionName?: string;
  step?: number;
}) => {
  const {
    client,
    readFunctionName = "getCount",
    incrementFunctionName = "increment",
    decrementFunctionName = "decrement",
    step = 1,
  } = parameters;

  const [handle, setHandle] = useState<string | undefined>(undefined);
  const [value, setValue] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const canMutate = useMemo(() => Boolean(client) && !isMutating, [client, isMutating]);

  const refresh = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const payload = await client.read(readFunctionName);
      setHandle(payload.handle);
      setValue(payload.value);
      setMessage("Counter refreshed");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [client, readFunctionName]);

  const mutate = useCallback(
    async (functionName: string, amount: number) => {
      if (!client) return;
      setIsMutating(true);
      setError(undefined);
      try {
        await client.mutate({ functionName, values: [amount] });
        setMessage(`${functionName}(${amount}) submitted`);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsMutating(false);
      }
    },
    [client, refresh],
  );

  const increment = useCallback(() => mutate(incrementFunctionName, step), [mutate, incrementFunctionName, step]);
  const decrement = useCallback(() => mutate(decrementFunctionName, step), [mutate, decrementFunctionName, step]);

  useEffect(() => {
    setHandle(undefined);
    setValue(undefined);
    if (client) {
      refresh();
    }
  }, [client, refresh]);

  return {
    client,
    handle,
    value,
    message,
    error,
    isLoading,
    isMutating,
    canMutate,
    refresh,
    increment,
    decrement,
  } as const;
};
