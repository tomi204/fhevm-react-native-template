import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type InfoRowProps = {
  label: string;
  value: ReactNode;
};

export const InfoRow = ({ label, value }: InfoRowProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d2d",
  },
  label: {
    color: "#9b9b9b",
    fontSize: 14,
  },
  value: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Menlo",
  },
});
