import { createConfig, registerContract } from "fhevm-sdk";
import deployedContracts from "~~/contracts/deployedContracts";
import ConfidentialTokenArtifact from "~~/contracts/ConfidentialToken.json";

const FHECounter = deployedContracts[31337].FHECounter;

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 31337,
      name: "Localhost",
      rpcUrl: "http://localhost:8545",
      isMock: true,
    },
    {
      id: 11155111,
      name: "Sepolia",
      rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      isMock: false,
    },
    {
      id: 8009,
      name: "Zama Devnet",
      rpcUrl: "https://devnet.zama.ai",
      isMock: false,
    },
  ],
  contracts: {
    FHECounter: {
      address: FHECounter.address as `0x${string}`,
      abi: FHECounter.abi as any,
      name: "FHECounter",
    },
    ConfidentialToken: {
      address: "0xac4d3C0f90A6a4B5b8ae16AFd78F1EEcF238eD70" as `0x${string}`,
      abi: ConfidentialTokenArtifact.abi as any,
      name: "ConfidentialToken",
    },
  },
  defaultMode: "local",
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});

// Register contracts for easy access
if (FHECounter.address && FHECounter.abi) {
  registerContract("FHECounter", {
    address: FHECounter.address as `0x${string}`,
    abi: FHECounter.abi as any,
  });
}

// Register Confidential Token (Sepolia only)
registerContract("ConfidentialToken", {
  address: "0xac4d3C0f90A6a4B5b8ae16AFd78F1EEcF238eD70" as `0x${string}`,
  abi: ConfidentialTokenArtifact.abi as any,
});
