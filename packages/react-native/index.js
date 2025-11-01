import { registerRootComponent } from "expo";
import App from "./App";

// Solo polyfills esenciales
import "react-native-get-random-values";

// Buffer y process
import { Buffer } from "buffer";
global.Buffer = Buffer;

if (typeof global.process === "undefined") {
  global.process = require("process");
}

registerRootComponent(App);
