import { createConfig } from "fhevm-sdk";
import deployedContracts from "~~/contracts/deployedContracts";
import ConfidentialTokenArtifact from "~~/contracts/ConfidentialToken.json";

const FHECounterLocalhost = deployedContracts[31337]?.FHECounter;
const FHECounterSepolia = deployedContracts[11155111]?.FHECounter;

export const fhevmConfig = createConfig({
  chains: [
    {
      id: 31337,
      name: "Localhost",
      rpcUrl: "http://localhost:8545",
      isMock: true,
      contracts: {
        FHECounter: {
          address: FHECounterLocalhost?.address as `0x${string}`,
          abi: FHECounterLocalhost?.abi as any,
        },
      },
    },
    {
      id: 11155111,
      name: "Sepolia",
      rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      isMock: false,
      contracts: {
        FHECounter: {
          address: FHECounterSepolia?.address as `0x${string}`,
          abi: FHECounterSepolia?.abi as any,
        },
        ConfidentialToken: {
          address: "0xac4d3C0f90A6a4B5b8ae16AFd78F1EEcF238eD70" as `0x${string}`,
          abi: ConfidentialTokenArtifact.abi as any,
        },
      },
    },
    {
      id: 8009,
      name: "Zama Devnet",
      rpcUrl: "https://devnet.zama.ai",
      isMock: false,
    },
  ],
  defaultMode: "local",
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
});

// Note: Per-chain contracts are configured above in the chains array.
// The registerContract function is optional and only needed if you want to
// add contracts to the global registry for use across all chains.
