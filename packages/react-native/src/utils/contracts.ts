import deployedContracts from "../../contracts/deployedContracts";

type ContractsDeclaration = typeof deployedContracts;
type ChainContracts = ContractsDeclaration[keyof ContractsDeclaration];

export type ContractName = keyof ChainContracts;
export type ContractConfig<TName extends ContractName = ContractName> = ChainContracts[TName];

const contractsByChain: Record<number, ChainContracts> = Object.keys(deployedContracts).reduce(
  (acc, key) => {
    acc[Number(key)] = deployedContracts[Number(key) as keyof ContractsDeclaration];
    return acc;
  },
  {} as Record<number, ChainContracts>,
);

export const KNOWN_CHAIN_IDS = Object.keys(contractsByChain).map(id => Number(id));

export const getDeployedContract = <TName extends ContractName>(
  chainId: number | undefined,
  contractName: TName,
): ContractConfig<TName> | undefined => {
  if (!chainId) return undefined;
  return contractsByChain[chainId]?.[contractName] as ContractConfig<TName> | undefined;
};
