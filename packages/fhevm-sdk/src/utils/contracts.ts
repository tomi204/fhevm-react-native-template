import type { Abi } from "abitype";
import type { ContractConfig } from "../config/types.js";

export type ContractRegistry = {
  [name: string]: ContractConfig;
};

const contractRegistry: ContractRegistry = {};

export function registerContract<TAbi extends Abi>(name: string, config: ContractConfig<TAbi>): void {
  contractRegistry[name] = config;
}

export function getRegisteredContract(name: string): ContractConfig | undefined {
  return contractRegistry[name];
}

export function getAllRegisteredContracts(): ContractRegistry {
  return { ...contractRegistry };
}

export function clearContractRegistry(): void {
  Object.keys(contractRegistry).forEach(key => {
    delete contractRegistry[key];
  });
}

// Helper to create contract registry from multiple contracts
export function createContractRegistry(contracts: Record<string, ContractConfig>): void {
  Object.entries(contracts).forEach(([name, config]) => {
    registerContract(name, config);
  });
}
