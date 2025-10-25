import { useMemo } from "react";
import { ethers } from "ethers";

export const useEphemeralWallet = () => {
  return useMemo(() => ethers.Wallet.createRandom(), []);
};
