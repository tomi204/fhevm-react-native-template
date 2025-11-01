import { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ethers } from "ethers";

const DEFAULT_RELAYER_URL = "http://localhost:4000";
const AUTH_MESSAGE_PREFIX = "ZAMA_FHE_REQUEST";

const FHE_COUNTER_CONTRACT = {
  address: "0xead137D42d2E6A6a30166EaEf97deBA1C3D1954e" as `0x${string}`,
  abi: [
    {
      inputs: [
        { internalType: "externalEuint32", name: "inputEuint32", type: "bytes32" },
        { internalType: "bytes", name: "inputProof", type: "bytes" },
      ],
      name: "decrement",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "getCount",
      outputs: [{ internalType: "euint32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "externalEuint32", name: "inputEuint32", type: "bytes32" },
        { internalType: "bytes", name: "inputProof", type: "bytes" },
      ],
      name: "increment",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "protocolId",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "pure",
      type: "function",
    },
  ],
} as const;

type SessionData = {
  sessionId: string;
  chainId: number;
  nonce: number;
  status?: string;
};

type MutateResponse =
  | { txHash: string; blockNumber: number; nextNonce?: number }
  | { mode: "client-sign"; params: unknown[]; nextNonce?: number };

export default function App() {
  const contractConfig = useMemo(() => FHE_COUNTER_CONTRACT, []);

  const [privateKey, setPrivateKey] = useState<string>("");
  const [relayerUrl, setRelayerUrl] = useState<string>(DEFAULT_RELAYER_URL);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [counterValue, setCounterValue] = useState<string | null>(null);
  const [counterHandle, setCounterHandle] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Enter your private key to start.");
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const effectiveRelayerUrl = relayerUrl.trim().replace(/\/+$/, "");

  const createSession = async (address: string, key: string) => {
    try {
      setIsBusy(true);
      setMessage("Creating session with relayer…");

      const response = await fetch(`${effectiveRelayerUrl}/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: contractConfig.address,
          abi: contractConfig.abi,
          userAddress: address,
          userPrivateKey: key,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Session failed: ${response.status} ${text}`);
      }

      const data = (await response.json()) as SessionData;
      setSession({ sessionId: data.sessionId, chainId: data.chainId, nonce: data.nonce, status: data.status });
      setMessage(data.status === "pending_signature" ? "Session pending signature." : "Session ready.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Session error: ${errorMessage}`);
      Alert.alert("Session Error", errorMessage);
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  const handleConnect = async () => {
    const trimmedKey = privateKey.trim();
    if (!trimmedKey) {
      Alert.alert("Missing private key", "Please enter a valid private key.");
      return;
    }

    try {
      const normalizedKey = trimmedKey.startsWith("0x") ? trimmedKey : `0x${trimmedKey}`;
      const newWallet = new ethers.Wallet(normalizedKey);
      setWallet(newWallet);
      await createSession(newWallet.address, normalizedKey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setWallet(null);
      setSession(null);
      setMessage(`Connection error: ${errorMessage}`);
      Alert.alert("Connection Error", errorMessage);
    }
  };

  const buildAuthMessage = (sessionId: string, functionName: string, values: number[], nonce: number) => {
    return `${AUTH_MESSAGE_PREFIX}:${sessionId}:${functionName}:${JSON.stringify(values ?? [])}:${nonce}`;
  };

  const handleRefresh = async (nonceOverride?: number) => {
    if (!wallet || !session) return;
    try {
      setIsBusy(true);
      setMessage("Reading encrypted counter…");

      const nonceToUse = typeof nonceOverride === "number" ? nonceOverride : session.nonce;
      if (typeof nonceToUse !== "number") {
        throw new Error("Session nonce unavailable");
      }

      const authMessage = buildAuthMessage(session.sessionId, "getCount", [], nonceToUse);
      const signature = await wallet.signMessage(authMessage);

      const response = await fetch(`${effectiveRelayerUrl}/v1/fhe/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          functionName: "getCount",
          signature,
          nonce: nonceToUse,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Read failed: ${response.status} ${text}`);
      }

      const data = (await response.json()) as { handle: string; value: string; nextNonce?: number };
      setCounterHandle(data.handle);
      setCounterValue(data.value);
      setSession(current =>
        current
          ? {
              ...current,
              nonce:
                typeof data.nextNonce === "number"
                  ? data.nextNonce
                  : nonceToUse + 1,
            }
          : current,
      );
      setMessage(`Counter value: ${data.value}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Read error: ${errorMessage}`);
      Alert.alert("Read Error", errorMessage);
    } finally {
      setIsBusy(false);
    }
  };

  const mutateContract = async (functionName: string, values: number[]) => {
    if (!wallet || !session) return;
    try {
      setIsBusy(true);
      setMessage(`Submitting ${functionName}(${values.join(", ")})…`);

      const authMessage = buildAuthMessage(session.sessionId, functionName, values, session.nonce);
      const signature = await wallet.signMessage(authMessage);

      const response = await fetch(`${effectiveRelayerUrl}/v1/fhe/mutate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          functionName,
          values,
          signature,
          nonce: session.nonce,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Mutate failed: ${response.status} ${text}`);
      }

      const data = (await response.json()) as MutateResponse;
      if ("mode" in data && data.mode === "client-sign") {
        setMessage("Relayer requested client-side signing. Not supported in this demo.");
      } else {
        const nextNonce = typeof data.nextNonce === "number" ? data.nextNonce : session.nonce + 1;
        setSession(current =>
          current
            ? {
                ...current,
                nonce: nextNonce,
              }
            : current,
        );
        setMessage(`Tx sent: ${(data as { txHash: string }).txHash.slice(0, 10)}…`);
        setTimeout(() => {
          void handleRefresh(nextNonce);
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Mutate error: ${errorMessage}`);
      Alert.alert("Mutation Error", errorMessage);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    setSession(null);
    setCounterValue(null);
    setCounterHandle(null);
    setMessage("Disconnected. Enter a private key to reconnect.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>FHE Counter Debug</Text>
        <Text style={styles.subtitle}>Relayer playground using ethers + Expo</Text>

        {!wallet ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect Wallet</Text>
            <Text style={styles.muted}>Enter a private key. The relayer will use it to encrypt/decrypt on your behalf.</Text>
            <TextInput
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="0x..."
              placeholderTextColor="#6f6f6f"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.muted}>Relayer URL</Text>
            <TextInput
              value={relayerUrl}
              onChangeText={setRelayerUrl}
              placeholder="http://localhost:4000"
              placeholderTextColor="#6f6f6f"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.button} onPress={handleConnect} disabled={isBusy}>
              <Text style={styles.buttonText}>{isBusy ? "Connecting…" : "Connect"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session</Text>
              <Text style={styles.label}>Account</Text>
              <Text style={styles.value}>{`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}</Text>
              <Text style={styles.label}>Session ID</Text>
              <Text style={styles.value}>{session?.sessionId ?? "—"}</Text>
              <Text style={styles.label}>Nonce</Text>
              <Text style={styles.value}>{session?.nonce ?? 0}</Text>
              <Text style={styles.label}>Relayer</Text>
              <Text style={styles.value}>{effectiveRelayerUrl}</Text>
              <TouchableOpacity style={[styles.button, styles.buttonGhost]} onPress={handleDisconnect}>
                <Text style={styles.buttonGhostText}>Disconnect</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Counter</Text>
              <Text style={styles.label}>Decrypted value</Text>
              <Text style={[styles.value, styles.highlight]}>{counterValue ?? "—"}</Text>
              <Text style={styles.label}>Encrypted handle</Text>
              <Text style={styles.value}>{counterHandle ? `${counterHandle.slice(0, 10)}…` : "—"}</Text>

              <TouchableOpacity
                style={[styles.button, styles.buttonGhost]}
                onPress={() => {
                  void handleRefresh();
                }}
                disabled={isBusy}
              >
                <Text style={styles.buttonGhostText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => mutateContract("increment", [1])} disabled={isBusy}>
                <Text style={styles.buttonText}>{isBusy ? "Working…" : "Increment"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => mutateContract("decrement", [1])} disabled={isBusy}>
                <Text style={styles.buttonSecondaryText}>{isBusy ? "Working…" : "Decrement"}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.status}>{message}</Text>
        </View>
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
    fontSize: 24,
    fontWeight: "800",
    color: "#f4f4f4",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#ffd208",
    marginTop: -4,
    marginBottom: 12,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#0c0c0c",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffd208",
  },
  input: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#333",
    color: "#f4f4f4",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "Courier",
  },
  button: {
    backgroundColor: "#ffd208",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#050505",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ffd208",
  },
  buttonGhostText: {
    color: "#ffd208",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: "#303030",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonSecondaryText: {
    color: "#f4f4f4",
    fontWeight: "700",
    fontSize: 16,
  },
  label: {
    color: "#9a9a9a",
    fontSize: 13,
  },
  value: {
    color: "#f4f4f4",
    fontSize: 14,
    fontFamily: "Courier",
  },
  highlight: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffd208",
  },
  muted: {
    color: "#7a7a7a",
    fontSize: 12,
  },
  status: {
    color: "#d1d1d1",
    fontSize: 14,
  },
});
