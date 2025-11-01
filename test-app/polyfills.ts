/* eslint-disable no-console */

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;

type CryptoLike = {
  getRandomValues?: <T extends TypedArray>(array: T) => T;
};

const scope = globalThis as Record<string, unknown>;

const ensureRandomValues = () => {
  const cryptoRef = (scope.crypto as CryptoLike | undefined) ?? {};

  if (typeof cryptoRef.getRandomValues === "function") {
    scope.crypto = cryptoRef;
    return;
  }

  let warned = false;
  cryptoRef.getRandomValues = function getRandomValues<T extends TypedArray>(array: T): T {
    if (!(array instanceof Int8Array || array instanceof Uint8Array || array instanceof Uint8ClampedArray || array instanceof Int16Array || array instanceof Uint16Array || array instanceof Int32Array || array instanceof Uint32Array)) {
      throw new TypeError("Expected an integer TypedArray");
    }

    if (!warned) {
      console.warn("[polyfills] Using Math.random() as crypto.getRandomValues fallback.");
      warned = true;
    }

    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };

  scope.crypto = cryptoRef;
};

ensureRandomValues();
