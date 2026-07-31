import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { ConnectionStatus } from "../../api/cloud";

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; color: string; backgroundColor: string }
> = {
  active: {
    label: "Connected",
    color: "#30D158",
    backgroundColor: "rgba(48,209,88,0.15)",
  },
  "not-connected": {
    label: "Not connected",
    color: "#8E8E93",
    backgroundColor: "#3A3A3C",
  },
  revoked: {
    label: "Disconnected",
    color: "#FF453A",
    backgroundColor: "rgba(255,69,58,0.15)",
  },
  expired: {
    label: "Expired",
    color: "#FF9F0A",
    backgroundColor: "rgba(255,159,10,0.15)",
  },
};

interface StatusPillProps {
  status: ConnectionStatus;
  style?: StyleProp<ViewStyle>;
}

export function StatusPill({ status, style }: StatusPillProps) {
  const meta = STATUS_META[status] ?? STATUS_META["not-connected"];

  return (
    <View
      style={[styles.pill, { backgroundColor: meta.backgroundColor }, style]}
    >
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
