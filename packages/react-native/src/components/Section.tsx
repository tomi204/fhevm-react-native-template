import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type SectionProps = {
  title: string;
  children: ReactNode;
};

export const Section = ({ title, children }: SectionProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2d2d2d",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f4f4f4",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  body: {
    gap: 12,
  },
});
