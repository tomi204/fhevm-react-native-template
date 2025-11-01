import "@walletconnect/react-native-compat";
import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppKitProvider, AppKit } from "@reown/appkit-react-native";
import { useRemoteFheCounter } from "fhevm-sdk";
import { appKit } from "./src/config/appkit";
import deployedContracts from "./contracts/deployedContracts";
import { ActionButton, InfoRow, Section, WalletButton } from "./src/components";
import { formatMessage } from "./src/utils/format";
import { useFhevmClient, useWallet } from "./src/hooks";

const sepoliaContract = deployedContracts[11155111]?.FHECounter;
const DEFAULT_RELAYER_OVERRIDE = "";

function AppContent() {
  const [relayerOverride, setRelayerOverride] = useState(DEFAULT_RELAYER_OVERRIDE);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_RELAYER_OVERRIDE);
  const { address, isConnected, chainId } = useWallet();

  const contractConfig = useMemo(() => sepoliaContract, []);

  const effectiveBaseUrl = useMemo(() => {
    const trimmed = relayerOverride.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [relayerOverride]);

  // Create FHE client using the relayer
  const { client, error: clientError, isLoading: isClientLoading } = useFhevmClient({
    contractAddress: contractConfig?.address as `0x${string}`,
    contractAbi: contractConfig?.abi ? [...contractConfig.abi] : [],
    contractName: "FHECounter",
    relayerBaseUrl: effectiveBaseUrl,
  });

  // Use the remote FHE counter hook
  const counter = useRemoteFheCounter({ client });

  const applyRelayerUrl = () => {
    setRelayerOverride(draftUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>FHE Counter (Remote SDK)</Text>
        <Text style={styles.subtitle}>Powered by Reown AppKit</Text>

        {/* Wallet Connection */}
        <Section title="Wallet">
          <WalletButton />
          {isConnected && (
            <>
              <InfoRow label="Address" value={address ?? "—"} />
              <InfoRow label="Chain ID" value={chainId?.toString() ?? "—"} />
            </>
          )}
        </Section>

        {/* Relayer Settings */}
        <Section title="Relayer Settings">
          <Text style={styles.muted}>
            Uses the default Zama relayer. Override only for local testing (ex: http://10.0.2.2:4000).
          </Text>
          <TextInput
            value={draftUrl}
            onChangeText={setDraftUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Optional override"
            placeholderTextColor="#6f6f6f"
            style={styles.input}
          />
          <ActionButton label="Apply Override" onPress={applyRelayerUrl} variant="ghost" />
        </Section>

        {/* Session Info */}
        <Section title="Session">
          <InfoRow label="Contract" value={contractConfig?.address ?? "—"} />
          <InfoRow label="Relayer URL" value={client?.metadata?.relayerBaseUrl ?? effectiveBaseUrl ?? "default"} />
          <InfoRow
            label="Relayer Key"
            value={client?.metadata?.authorizationPublicKey ?? "—"}
          />
          <InfoRow label="Session ID" value={client?.metadata?.sessionId ?? "—"} />
          <InfoRow
            label="Status"
            value={
              !isConnected
                ? "Connect wallet first"
                : isClientLoading
                ? "Connecting…"
                : client
                ? "Ready"
                : "Idle"
            }
          />
          {clientError && <Text style={[styles.status, styles.error]}>{clientError}</Text>}
        </Section>

        {/* Counter Operations */}
        <Section title="Counter">
          <InfoRow label="Decrypted value" value={counter.value ?? "—"} />
          <InfoRow label="Encrypted handle" value={counter.handle ?? "—"} />
          <View style={styles.buttonColumn}>
            <ActionButton
              label="Refresh"
              onPress={counter.refresh}
              disabled={counter.isLoading || !client || !isConnected}
              variant="ghost"
            />
            <ActionButton
              label={counter.isMutating ? "Working…" : "Increment"}
              onPress={counter.increment}
              disabled={!counter.canMutate || !isConnected}
              variant="primary"
            />
            <ActionButton
              label={counter.isMutating ? "Working…" : "Decrement"}
              onPress={counter.decrement}
              disabled={!counter.canMutate || !isConnected}
              variant="secondary"
            />
          </View>
        </Section>

        {/* Messages */}
        <Section title="Messages">
          <Text style={styles.status}>{formatMessage(counter.message)}</Text>
          {counter.error && <Text style={[styles.status, styles.error]}>{counter.error}</Text>}
        </Section>
      </ScrollView>

      {/* AppKit Modal */}
      <View style={styles.appKitContainer}>
        <AppKit />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppKitProvider instance={appKit}>
        <AppContent />
      </AppKitProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f4f4f4",
  },
  subtitle: {
    fontSize: 14,
    color: "#ffd208",
    marginTop: -8,
    marginBottom: 8,
  },
  muted: {
    color: "#8c8c8c",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#0c0c0c",
    borderWidth: 1,
    borderColor: "#242424",
    color: "#f8f8f8",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "Menlo",
  },
  buttonColumn: {
    gap: 10,
    marginTop: 12,
  },
  status: {
    color: "#d1d1d1",
    fontSize: 13,
  },
  error: {
    color: "#f87171",
    marginTop: 8,
  },
  appKitContainer: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
});
