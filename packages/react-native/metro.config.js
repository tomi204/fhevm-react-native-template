const path = require("path");
const { getDefaultConfig } = require("@expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Mock web-only dependencies that are imported by fhevm-sdk but not used in React Native
const webOnlyMocks = {
  "@reown/appkit/react": path.resolve(projectRoot, "mocks/@reown-appkit-react.js"),
  "wagmi": path.resolve(projectRoot, "mocks/wagmi.js"),
  "@reown/appkit-adapter-wagmi": path.resolve(projectRoot, "mocks/@reown-appkit-adapter-wagmi.js"),
  "@tanstack/react-query": path.resolve(projectRoot, "mocks/@tanstack-react-query.js"),
};

config.resolver.extraNodeModules = new Proxy(webOnlyMocks, {
  get: (target, name) => {
    // Return mock if it exists, otherwise use default resolution
    if (name in target) {
      return target[name];
    }
    // Don't override - let Metro resolve normally
    return undefined;
  },
});

// Ensure Metro can resolve dependencies from workspace node_modules
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
