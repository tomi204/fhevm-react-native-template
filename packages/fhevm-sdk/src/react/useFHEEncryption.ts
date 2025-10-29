"use client";

import { useCallback, useMemo } from "react";
import { FhevmInstance } from "../fhevmTypes.js";
import { RelayerEncryptedInput } from "@zama-fhe/relayer-sdk/web";
import { ethers } from "ethers";

export type EncryptResult = {
  handles: Uint8Array[];
  inputProof: Uint8Array;
};

// Map external encrypted integer type to RelayerEncryptedInput builder method
export const getEncryptionMethod = (internalType: string) => {
  switch (internalType) {
    case "externalEbool":
      return "addBool" as const;
    case "externalEuint8":
      return "add8" as const;
    case "externalEuint16":
      return "add16" as const;
    case "externalEuint32":
      return "add32" as const;
    case "externalEuint64":
      return "add64" as const;
    case "externalEuint128":
      return "add128" as const;
    case "externalEuint256":
      return "add256" as const;
    case "externalEaddress":
      return "addAddress" as const;
    default:
      console.warn(`Unknown internalType: ${internalType}, defaulting to add64`);
      return "add64" as const;
  }
};

// Convert Uint8Array or hex-like string to 0x-prefixed hex string
export const toHex = (value: Uint8Array | string): `0x${string}` => {
  if (typeof value === "string") {
    return (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;
  }
  // value is Uint8Array
  return ("0x" + Buffer.from(value).toString("hex")) as `0x${string}`;
};

// Build contract params from EncryptResult and ABI for a given function
export const buildParamsFromAbi = (
  enc: EncryptResult,
  abi: any[],
  functionName: string,
  originalArgs?: any[],
): any[] => {
  const fn = abi.find((item: any) => item.type === "function" && item.name === functionName);
  if (!fn) throw new Error(`Function ABI not found for ${functionName}`);

  console.log("🔧 buildParamsFromAbi:", {
    functionName,
    inputs: fn.inputs,
    originalArgsLength: originalArgs?.length,
    handlesLength: enc.handles.length,
    hasInputProof: !!enc.inputProof,
  });

  let handleIndex = 0;

  const result = fn.inputs.map((input: any, index: number) => {
    const internalType = input.internalType || "";
    const paramType = input.type || "";
    const paramName = input.name || "";

    console.log(`  📝 Processing param ${index}:`, {
      name: paramName,
      type: paramType,
      internalType,
    });

    // Special case: if this is an inputProof parameter, use the encrypted inputProof
    // This must be checked FIRST before checking if it's encrypted
    if (paramType === "bytes" && paramName === "inputProof") {
      const value = toHex(enc.inputProof);
      console.log(`    ✓ inputProof bytes:`, value);
      return value;
    }

    // Check if this input needs encryption
    const isEncrypted = internalType.startsWith("euint") || internalType.startsWith("externalE");

    if (!isEncrypted) {
      // Return original argument for non-encrypted params
      console.log(`    ✓ Non-encrypted, using original:`, originalArgs?.[index]);
      return originalArgs?.[index];
    }

    // Handle encrypted types
    if (internalType.startsWith("externalE")) {
      // For externalE types, first param is handle, rest is inputProof
      if (handleIndex === 0) {
        handleIndex++;
        const value = toHex(enc.handles[0]);
        console.log(`    ✓ externalE handle:`, value);
        return value;
      } else {
        const value = toHex(enc.inputProof);
        console.log(`    ✓ externalE inputProof:`, value);
        return value;
      }
    } else if (internalType.startsWith("euint")) {
      // For euint types, just use the handle (no inputProof needed for euint direct types)
      const handle = enc.handles[handleIndex];
      handleIndex++;
      const value = toHex(handle);
      console.log(`    ✓ euint handle:`, value);
      return value;
    }

    console.log(`    ⚠️ Fallback to original:`, originalArgs?.[index]);
    return originalArgs?.[index];
  });

  console.log("✅ buildParamsFromAbi result:", result);
  return result;
};

export const useFHEEncryption = (params: {
  instance: FhevmInstance | undefined;
  ethersSigner: ethers.Signer | undefined;
  contractAddress: `0x${string}` | undefined;
}) => {
  const { instance, ethersSigner, contractAddress } = params;

  const canEncrypt = useMemo(
    () => Boolean(instance && ethersSigner && contractAddress),
    [instance, ethersSigner, contractAddress],
  );

  const encryptWith = useCallback(
    async (buildFn: (builder: RelayerEncryptedInput) => void): Promise<EncryptResult | undefined> => {
      if (!instance || !ethersSigner || !contractAddress) return undefined;

      const userAddress = await ethersSigner.getAddress();
      const input = instance.createEncryptedInput(contractAddress, userAddress) as RelayerEncryptedInput;
      buildFn(input);
      const enc = await input.encrypt();
      return enc;
    },
    [instance, ethersSigner, contractAddress],
  );

  return {
    canEncrypt,
    encryptWith,
  } as const;
};
