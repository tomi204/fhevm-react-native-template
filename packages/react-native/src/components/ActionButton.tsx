import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  icon?: ReactNode;
};

const labelColors: Record<Variant, string> = {
  primary: "#050505",
  secondary: "#f4f4f4",
  ghost: "#ffd208",
};

export const ActionButton = ({ label, onPress, disabled, variant = "primary", icon }: ActionButtonProps) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, styles[variant], disabled && styles.disabled]}
    >
      {icon}
      <Text style={[styles.label, { color: labelColors[variant] }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const shared: ViewStyle = {
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 8,
};

const styles = StyleSheet.create({
  base: {
    ...shared,
  },
  primary: {
    backgroundColor: "#ffd208",
  },
  secondary: {
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ffd20855",
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
