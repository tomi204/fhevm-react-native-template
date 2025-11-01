import { useState, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ethers } from "ethers";
import deployedContracts from "./contracts/deployedContracts";

const sepoliaContract = deployedContracts[11155111]?.FHECounter;
const DEFAULT_RELAYER_URL = "http://localhost:4000";

type SessionData = {
  sessionId: string;
  chainId: number;
  nonce: number;
};

export default function App() {
  const [privateKey, setPrivateKey] = useState("");
  const [relayerUrl, setRelayerUrl] = useState(DEFAULT_RELAYER_URL);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [counterValue, setCounterValue] = useState<string | null>(null);
  const [counterHandle, setCounterHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Enter your private key to start");

  const contractConfig = useMemo(() => sepoliaContract, []);

  const handleConnect = () => {
    try {
      if (!privateKey.trim()) {
        Alert.alert("Error", "Please enter a private key");
        return;
      }

      const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      const newWallet = new ethers.Wallet(key);
      setWallet(newWallet);
      setMessage("Wallet connected! Creating session...");
      createSession(newWallet.address, key);
    } catch (error: any) {
      Alert.alert("Error", `Invalid private key: ${error.message}`);
    }
  };

  const createSession = async (address: string, key: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${relayerUrl}/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: contractConfig?.address,
          abi: contractConfig?.abi ? [...contractConfig.abi] : [],
          userAddress: address,
          userPrivateKey: key,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setSession(data);
      setMessage("✅ Session created! Ready to use FHE.");
    } catch (error: any) {
      setMessage(`❌ Session error: ${error.message}`);
      Alert.alert("Session Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!session || !wallet) return;

    try {
      setLoading(true);
      setMessage("🔄 Reading encrypted counter...");

      const authMessage = `ZAMA_FHE_REQUEST:${session.sessionId}:getCount:[]:${session.nonce}`;
      const signature = await wallet.signMessage(authMessage);

      const response = await fetch(`${relayerUrl}/v1/fhe/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          functionName: "getCount",
          signature,
          nonce: session.nonce,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setCounterHandle(data.handle);
      setCounterValue(data.value);
      setSession({ ...session, nonce: data.nextNonce });
      setMessage(`✅ Counter value: ${data.value}`);
    } catch (error: any) {
      setMessage(`❌ Read error: ${error.message}`);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (!session || !wallet) return;

    try {
      setLoading(true);
      setMessage("⏳ Encrypting and sending increment...");

      const authMessage = `ZAMA_FHE_REQUEST:${session.sessionId}:increment:[1]:${session.nonce}`;
      const signature = await wallet.signMessage(authMessage);

      const response = await fetch(`${relayerUrl}/v1/fhe/mutate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          functionName: "increment",
          values: [1],
          signature,
          nonce: session.nonce,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setSession({ ...session, nonce: data.nextNonce });
      setMessage(`✅ Transaction sent! ${data.txHash.slice(0, 10)}...`);

      setTimeout(() => handleRefresh(), 3000);
    } catch (error: any) {
      setMessage(`❌ Increment error: ${error.message}`);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    setSession(null);
    setCounterValue(null);
    setCounterHandle(null);
    setMessage("Disconnected. Enter private key to reconnect.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>🔐 Simple FHE Wallet</Text>
        <Text style={styles.subtitle}>Private Key → Relayer → Decrypt</Text>

        {!wallet ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect Wallet</Text>
            <Text style={styles.muted}>
              Enter your private key. The relayer will use it to encrypt/decrypt.
            </Text>
            <TextInput
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="0x... or paste without 0x"
              placeholderTextColor="#6f6f6f"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <TextInput
              value={relayerUrl}
              onChangeText={setRelayerUrl}
              placeholder="Relayer URL"
              placeholderTextColor="#6f6f6f"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.button} onPress={handleConnect} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Connecting..." : "Connect"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wallet</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Session:</Text>
                <Text style={styles.value}>{session?.sessionId?.slice(0, 8) || "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <Text style={styles.value}>{session ? "✅ Connected" : "⏳ Connecting..."}</Text>
              </View>
              <TouchableOpacity style={[styles.button, styles.buttonGhost]} onPress={handleDisconnect}>
                <Text style={styles.buttonTextGhost}>Disconnect</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Counter</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Value:</Text>
                <Text style={[styles.value, styles.valueHighlight]}>{counterValue ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Handle:</Text>
                <Text style={styles.value}>{counterHandle ? `${counterHandle.slice(0, 10)}...` : "—"}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonGhost]}
                onPress={handleRefresh}
                disabled={loading || !session}
              >
                <Text style={styles.buttonTextGhost}>🔄 Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={handleIncrement}
                disabled={loading || !session}
              >
                <Text style={styles.buttonText}>{loading ? "⏳ Working..." : "➕ Increment (+1)"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <Text style={styles.status}>{message}</Text>
            </View>
          </>
        )}
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
    marginTop: -8,
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#0c0c0c",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#242424",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffd208",
    marginBottom: 4,
  },
  muted: {
    color: "#8c8c8c",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    color: "#f8f8f8",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "Courier",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    color: "#999",
    fontSize: 14,
  },
  value: {
    color: "#f4f4f4",
    fontSize: 14,
    fontFamily: "Courier",
  },
  valueHighlight: {
    color: "#ffd208",
    fontWeight: "700",
    fontSize: 20,
  },
  button: {
    backgroundColor: "#ffd208",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ffd208",
  },
  buttonText: {
    color: "#050505",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonTextGhost: {
    color: "#ffd208",
    fontWeight: "700",
    fontSize: 16,
  },
  status: {
    color: "#d1d1d1",
    fontSize: 14,
    lineHeight: 20,
  },
});
