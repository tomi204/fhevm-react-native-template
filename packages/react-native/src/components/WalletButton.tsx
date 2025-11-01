import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAppKit } from "@reown/appkit-react-native";
import { useWallet } from "../hooks";

/**
 * Wallet connection button using Reown AppKit
 */
export const WalletButton = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useWallet();

  const handlePress = () => {
    open();
  };

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.button, isConnected && styles.connected]}
    >
      <Text style={styles.label}>{isConnected ? displayAddress : "Connect Wallet"}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#ffd208",
    alignItems: "center",
    justifyContent: "center",
  },
  connected: {
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#ffd208",
  },
  label: {
    color: "#050505",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
