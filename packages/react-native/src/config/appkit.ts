import "@walletconnect/react-native-compat";
import { createAppKit, type AppKitNetwork } from "@reown/appkit-react-native";
import { EthersAdapter } from "@reown/appkit-ethers-react-native";
import { storage } from "./storage";

// Define Sepolia network (matching the existing setup)
const sepolia: AppKitNetwork = {
  id: 11155111,
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
  chainNamespace: "eip155",
};

// TODO: Replace with your actual Reown project ID from https://cloud.reown.com
const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || "YOUR_PROJECT_ID";

const ethersAdapter = new EthersAdapter();

export const appKit = createAppKit({
  projectId,
  networks: [sepolia],
  defaultNetwork: sepolia,
  adapters: [ethersAdapter],
  storage,
  metadata: {
    name: "FHEVM React Native",
    description: "Fully Homomorphic Encryption on Mobile",
    url: "https://fhevm.zama.ai",
    icons: ["https://fhevm.zama.ai/favicon.ico"],
    redirect: {
      native: "fhevmrn://",
      universal: "fhevm.zama.ai",
    },
  },
});
