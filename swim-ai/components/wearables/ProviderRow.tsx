import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WearableProvider } from "./buildProviders";
import { ProviderIcon } from "./ProviderIcon";
import { StatusPill } from "./StatusPill";

export function formatSyncDate(iso: string | null): string | null {
  if (iso == null) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `Sync: ${y}/${mo}/${d} at ${h}:${mi}:${s}`;
}

interface ProviderRowProps {
  provider: WearableProvider;
  onPress: (provider: WearableProvider) => void;
}

export function ProviderRow({ provider, onPress }: ProviderRowProps) {
  const subtitle =
    provider.disabledReason && !provider.hasCloudApi
      ? provider.disabledReason
      : formatSyncDate(provider.lastSyncedAt);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        provider.isDisabled && styles.cardDisabled,
        pressed && !provider.isDisabled && styles.cardPressed,
      ]}
      onPress={() => onPress(provider)}
      disabled={provider.isDisabled}
    >
      <StatusPill status={provider.status} style={styles.cornerPill} />
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <ProviderIcon iconUrl={provider.iconUrl} />
        </View>
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{provider.name}</Text>
            {provider.hasCloudApi && (
              <Ionicons name="cloud-outline" size={13} color="#8E8E93" />
            )}
          </View>
          {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#48484A" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 12,
    overflow: "hidden",
  },
  cardDisabled: {
    opacity: 0.45,
  },
  cardPressed: {
    backgroundColor: "#3A3A3C",
  },
  cornerPill: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRadius: 0,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#8E8E93",
  },
});
