import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { Chain, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import scaffoldConfig, { ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/helper";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Create Reown WagmiAdapter
export const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId: scaffoldConfig.walletConnectProjectId,
  ssr: true,
});

// Export the wagmi config for use with hooks
export const reownWagmiConfig = wagmiAdapter.wagmiConfig;
