import "react-native-gesture-handler";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
import process from "process";

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === "undefined") {
  globalThis.process = process;
} else if (!(globalThis.process && globalThis.process.version)) {
  globalThis.process.env = globalThis.process.env || {};
}

if (typeof globalThis.SharedArrayBuffer === "undefined") {
  globalThis.SharedArrayBuffer = globalThis.ArrayBuffer;
}

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
