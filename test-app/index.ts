import { registerRootComponent } from "expo";
import "./polyfills";
import { Buffer } from "buffer";

import App from "./App";

type LooseProcess = {
  env: Record<string, string | undefined>;
  version: string;
  versions: Record<string, string>;
  nextTick: (handler: (...args: unknown[]) => void) => void;
};

const globalObject = globalThis as typeof globalThis & Record<string, unknown>;

if (!("Buffer" in globalObject)) {
  (globalObject as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

if (!("process" in globalObject)) {
  (globalObject as { process?: LooseProcess }).process = {
    env: { NODE_ENV: __DEV__ ? "development" : "production" },
    version: "mobile",
    versions: { node: "mobile" },
    nextTick: handler => setTimeout(handler, 0),
  };
}

registerRootComponent(App);
