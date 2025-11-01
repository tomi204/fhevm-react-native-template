import { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";
import { SDK_CDN_URL } from "./constants";
import { getGlobalScope, hasDomAPIs } from "./runtime";
import type { GlobalScope } from "./runtime";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;

  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  public isLoaded() {
    const scope = getGlobalScope();
    if (!scope) return false;
    return isFhevmWindowType(scope, this._trace);
  }

  public load(): Promise<void> {
    console.log("[RelayerSDKLoader] load...");
    const scope = getGlobalScope();
    if (!scope) {
      console.log("[RelayerSDKLoader] global scope unavailable");
      return Promise.reject(
        new Error("RelayerSDKLoader: global scope is undefined")
      );
    }

    if (!hasDomAPIs()) {
      return this.loadWithoutDom(scope, () => this.importRelayerSdkForNode());
    }

    if ("relayerSDK" in scope) {
      if (!isFhevmRelayerSDKType(scope.relayerSDK, this._trace)) {
        console.log("[RelayerSDKLoader] relayerSDK present but invalid");
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    // Try dynamic import first (avoids CORS issues with CDN)
    return this.loadWithoutDom(scope, () => this.importRelayerSdkForWeb()).catch(err => {
      console.log("[RelayerSDKLoader] Web import failed, falling back to script", err);
      if (typeof document === "undefined") {
        return this.loadWithoutDom(scope, () => this.importRelayerSdkForNode());
      }
      return this.loadViaScript(scope);
    });
  }

  private loadViaScript(scope: GlobalScope): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${SDK_CDN_URL}"]`
      );
      if (existingScript) {
        const scriptElement = existingScript as HTMLScriptElement & { readyState?: string };
        const onLoad = () => {
          scriptElement.removeEventListener("load", onLoad);
          scriptElement.removeEventListener("error", onError);
          if (!isFhevmWindowType(scope, this._trace)) {
            this.loadWithoutDom(scope, () => this.importRelayerSdkForWeb())
              .then(resolve)
              .catch(reject);
            return;
          }
          resolve();
        };
        const onError = () => {
          scriptElement.removeEventListener("load", onLoad);
          scriptElement.removeEventListener("error", onError);
          this.loadWithoutDom(scope, () => this.importRelayerSdkForWeb())
            .then(resolve)
            .catch(reject);
        };

        scriptElement.addEventListener("load", onLoad);
        scriptElement.addEventListener("error", onError);

        if (scriptElement.readyState === "complete") {
          onLoad();
        }

        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      const scriptElement: HTMLScriptElement & { readyState?: string } = script;
      const onLoad = () => {
        scriptElement.removeEventListener("load", onLoad);
        scriptElement.removeEventListener("error", onError);
        if (!isFhevmWindowType(scope, this._trace)) {
          console.log("[RelayerSDKLoader] script onload FAILED...");
          this.loadWithoutDom(scope, () => this.importRelayerSdkForWeb())
            .then(resolve)
            .catch(reject);
          return;
        }
        resolve();
      };

      const onError = () => {
        scriptElement.removeEventListener("load", onLoad);
        scriptElement.removeEventListener("error", onError);
        console.log("[RelayerSDKLoader] script onerror... ");
        this.loadWithoutDom(scope, () => this.importRelayerSdkForWeb())
          .then(resolve)
          .catch(reject);
      };

      scriptElement.addEventListener("load", onLoad);
      scriptElement.addEventListener("error", onError);

      console.log("[RelayerSDKLoader] add script to DOM...");
      document.head.appendChild(script);
      console.log("[RelayerSDKLoader] script added!");
    });
  }

  private async loadWithoutDom(
    scope: GlobalScope,
    importer: () => Promise<Record<string, unknown>>
  ): Promise<void> {
    console.log("[RelayerSDKLoader] loadWithoutDom");
    if ("relayerSDK" in scope) {
      if (!isFhevmRelayerSDKType(scope.relayerSDK, this._trace)) {
        throw new Error("RelayerSDKLoader: relayerSDK is invalid in global scope.");
      }
      return;
    }

    try {
      const module = await importer();
      const candidate = normalizeRelayerSdkModule(module, this._trace);
      if (!isFhevmRelayerSDKType(candidate, this._trace)) {
        throw new Error(
          "RelayerSDKLoader: relayer SDK module did not expose a valid relayerSDK object."
        );
      }
      const scoped = scope as GlobalScope & { relayerSDK: FhevmRelayerSDKType };
      scoped.relayerSDK = candidate;
    } catch (error) {
      const err = new Error(
        "RelayerSDKLoader: Failed to load relayer SDK outside of the browser."
      );
      (err as any).cause = error;
      throw err;
    }
  }

  private async importRelayerSdkForNode() {
    try {
      return await import("@zama-fhe/relayer-sdk/node");
    } catch {
      return import("@zama-fhe/relayer-sdk/bundle");
    }
  }

  private async importRelayerSdkForWeb() {
    try {
      return await import("@zama-fhe/relayer-sdk/web");
    } catch {
      return this.importRelayerSdkForNode();
    }
  }
}

function normalizeRelayerSdkModule(
  module: Record<string, unknown>,
  trace?: TraceType
) {
  const candidate =
    module.relayerSDK ?? module.default ?? module;

  if (
    candidate &&
    typeof candidate === "object" &&
    "createInstance" in candidate &&
    typeof (candidate as any).createInstance === "function" &&
    !("initSDK" in candidate)
  ) {
    trace?.("[RelayerSDKLoader] Detected Node SDK shape; creating shim");
    return {
      ...(candidate as Record<string, unknown>),
      initSDK: async () => true,
      __initialized__: true,
    } satisfies Partial<FhevmRelayerSDKType>;
  }

  return candidate;
}

function isFhevmRelayerSDKType(
  o: unknown,
  trace?: TraceType
): o is FhevmRelayerSDKType {
  if (typeof o === "undefined") {
    trace?.("RelayerSDKLoader: relayerSDK is undefined");
    return false;
  }
  if (o === null) {
    trace?.("RelayerSDKLoader: relayerSDK is null");
    return false;
  }
  if (typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is not an object");
    return false;
  }
  if (!objHasProperty(o, "initSDK", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.initSDK is invalid");
    return false;
  }
  if (!objHasProperty(o, "createInstance", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.createInstance is invalid");
    return false;
  }
  if (!objHasProperty(o, "SepoliaConfig", "object", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
    return false;
  }
  if ("__initialized__" in o) {
    if (o.__initialized__ !== true && o.__initialized__ !== false) {
      trace?.("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
      return false;
    }
  }
  return true;
}

export function isFhevmWindowType(
  win: unknown,
  trace?: TraceType
): win is FhevmWindowType {
  if (typeof win === "undefined") {
    trace?.("RelayerSDKLoader: window object is undefined");
    return false;
  }
  if (win === null) {
    trace?.("RelayerSDKLoader: window object is null");
    return false;
  }
  if (typeof win !== "object") {
    trace?.("RelayerSDKLoader: window is not an object");
    return false;
  }
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
    return false;
  }
  return isFhevmRelayerSDKType(win.relayerSDK);
}

function objHasProperty<
  T extends object,
  K extends PropertyKey,
  V extends string // "string", "number", etc.
>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: TraceType
): obj is T &
  Record<
    K,
    V extends "string"
      ? string
      : V extends "number"
      ? number
      : V extends "object"
      ? object
      : V extends "boolean"
      ? boolean
      : V extends "function"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]) => any
      : unknown
  > {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
    return false;
  }

  const value = (obj as Record<K, unknown>)[propertyName];

  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    trace?.(
      `RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`
    );
    return false;
  }

  return true;
}
