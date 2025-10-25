import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { createFheClient, useRemoteFheCounter, type FheClient } from "@fhevm-sdk";
import deployedContracts from "./contracts/deployedContracts";
import { ActionButton, InfoRow, Section } from "./src/components";
import { formatMessage } from "./src/utils/format";
import { useEphemeralWallet } from "./src/hooks/useEphemeralWallet";

const sepoliaContract = deployedContracts[11155111]?.FHECounter;
const DEFAULT_RELAYER_OVERRIDE = "";

export default function App() {
  const [relayerOverride, setRelayerOverride] = useState(DEFAULT_RELAYER_OVERRIDE);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_RELAYER_OVERRIDE);
  const [client, setClient] = useState<FheClient | undefined>(undefined);
  const [clientError, setClientError] = useState<string | undefined>(undefined);
  const [isClientLoading, setIsClientLoading] = useState<boolean>(false);
  const wallet = useEphemeralWallet();

  const contractConfig = useMemo(() => sepoliaContract, []);

  const effectiveBaseUrl = useMemo(() => {
    const trimmed = relayerOverride.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [relayerOverride]);

  useEffect(() => {
    setDraftUrl(relayerOverride);
  }, [relayerOverride]);

  useEffect(() => {
    if (!contractConfig) return;
    let cancelled = false;
    setIsClientLoading(true);
    setClient(undefined);
    setClientError(undefined);
    createFheClient({
      contract: {
        address: contractConfig.address as `0x${string}`,
        abi: contractConfig.abi as any[],
        name: "FHECounter",
      },
      mode: "remote",
      relayer: {
        baseUrl: effectiveBaseUrl,
      },
      signer: wallet,
    })
      .then(created => {
        if (!cancelled) setClient(created);
      })
      .catch(err => {
        if (!cancelled) setClientError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsClientLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractConfig, effectiveBaseUrl]);

  const counter = useRemoteFheCounter({ client });

  const applyRelayerUrl = () => {
    setRelayerOverride(draftUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>FHE Counter (Remote SDK)</Text>

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

        <Section title="Session">
          <InfoRow label="Contract" value={contractConfig?.address ?? "—"} />
          <InfoRow label="Relayer URL" value={client?.metadata?.relayerBaseUrl ?? effectiveBaseUrl ?? "default"} />
          <InfoRow label="Session ID" value={client?.metadata?.sessionId ?? "—"} />
          <InfoRow label="Status" value={isClientLoading ? "Connecting…" : client ? "Ready" : "Idle"} />
          <InfoRow label="User address" value={wallet.address} />
          {clientError && <Text style={[styles.status, styles.error]}>{clientError}</Text>}
        </Section>

        <Section title="Counter">
          <InfoRow label="Decrypted value" value={counter.value ?? "—"} />
          <InfoRow label="Encrypted handle" value={counter.handle ?? "—"} />
          <View style={styles.buttonColumn}>
            <ActionButton label="Refresh" onPress={counter.refresh} disabled={counter.isLoading || !client} variant="ghost" />
            <ActionButton
              label={counter.isMutating ? "Working…" : "Increment"}
              onPress={counter.increment}
              disabled={!counter.canMutate}
              variant="primary"
            />
            <ActionButton
              label={counter.isMutating ? "Working…" : "Decrement"}
              onPress={counter.decrement}
              disabled={!counter.canMutate}
              variant="secondary"
            />
          </View>
        </Section>

        <Section title="Messages">
          <Text style={styles.status}>{formatMessage(counter.message)}</Text>
          {counter.error && <Text style={[styles.status, styles.error]}>{counter.error}</Text>}
        </Section>
      </ScrollView>
    </SafeAreaView>
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
});
