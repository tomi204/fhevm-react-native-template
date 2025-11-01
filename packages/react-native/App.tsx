import { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import AppReown from "./App.reown";
import AppFull from "./App.full";

const APP_VARIANTS = {
  reown: AppReown,
  full: AppFull,
} as const;

function getVariant() {
  const raw =
    process.env.EXPO_PUBLIC_APP_MODE ??
    (globalThis as any)?.expo?.env?.EXPO_PUBLIC_APP_MODE ??
    "reown";
  const normalized = typeof raw === "string" ? raw.trim().toLowerCase() : "reown";
  return normalized in APP_VARIANTS ? (normalized as keyof typeof APP_VARIANTS) : "reown";
}

export default function App() {
  const SelectedApp = useMemo(() => APP_VARIANTS[getVariant()], []);

  if (!SelectedApp) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator size="large" color="#ffd208" />
        <Text style={styles.fallbackText}>Loading interface…</Text>
      </View>
    );
  }

  return <SelectedApp />;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    gap: 12,
  },
  fallbackText: {
    color: "#d1d1d1",
    fontSize: 14,
  },
});
