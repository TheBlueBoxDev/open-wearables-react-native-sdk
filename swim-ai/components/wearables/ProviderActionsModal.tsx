import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WearableProvider } from "./buildProviders";
import { formatSyncDate } from "./ProviderRow";
import { ProviderIcon } from "./ProviderIcon";
import { StatusPill } from "./StatusPill";

interface ActionButtonProps {
  iconName: string;
  title: string;
  subtitle?: string | null;
  color?: string;
  disabled?: boolean;
  onPress: () => void;
}

function ActionButton({
  iconName,
  title,
  subtitle,
  color = "#FFFFFF",
  disabled = false,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        disabled && styles.optionDisabled,
        pressed && !disabled && styles.optionPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={iconName as any}
        size={20}
        color={disabled ? "#48484A" : color}
      />
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: disabled ? "#48484A" : color }]}>
          {title}
        </Text>
        {subtitle != null && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

interface ProviderActionsModalProps {
  provider: WearableProvider | null;
  busy?: boolean;
  onClose: () => void;
  onSyncNow: () => void;
  onDisconnect: () => void;
  onNativeConnect: () => void;
  onCloudConnect: () => void;
}

export function ProviderActionsModal({
  provider,
  busy = false,
  onClose,
  onSyncNow,
  onDisconnect,
  onNativeConnect,
  onCloudConnect,
}: ProviderActionsModalProps) {
  const isActive = provider != null && provider.status === "active";
  const isDualChoice =
    provider != null && !isActive && provider.isNative && provider.hasCloudApi;

  return (
    <Modal
      visible={provider != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {provider != null && (
            <>
              <View style={styles.header}>
                <View style={styles.iconBox}>
                  <ProviderIcon iconUrl={provider.iconUrl} size={26} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{provider.name}</Text>
                  {isActive && provider.lastSyncedAt != null && (
                    <Text style={styles.lastSync}>
                      {formatSyncDate(provider.lastSyncedAt)}
                    </Text>
                  )}
                </View>
                <StatusPill status={provider.status} />
              </View>

              <View style={styles.divider} />

              {isDualChoice && (
                <>
                  <Text style={styles.sectionTitle}>
                    How do you want to connect?
                  </Text>
                  <ActionButton
                    iconName="phone-portrait-outline"
                    title="From this device"
                    subtitle={provider.disabledReason}
                    disabled={provider.disabledReason != null || busy}
                    onPress={onNativeConnect}
                  />
                  <ActionButton
                    iconName="cloud-outline"
                    title="From your account"
                    disabled={busy}
                    onPress={onCloudConnect}
                  />
                </>
              )}

              {isActive && (
                <>
                  {provider.isNative && (
                    <>
                      <ActionButton
                        iconName="sync-outline"
                        title="Sync now"
                        disabled={busy}
                        onPress={onSyncNow}
                      />
                      <Text style={styles.helpText}>
                        Data syncs automatically. Use this only to force an
                        update.
                      </Text>
                    </>
                  )}
                  <ActionButton
                    iconName="unlink-outline"
                    title="Disconnect"
                    color="#FF453A"
                    disabled={busy}
                    onPress={onDisconnect}
                  />
                </>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  lastSync: {
    fontSize: 12,
    color: "#8E8E93",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#38383A",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
  },
  helpText: {
    fontSize: 11,
    color: "#636366",
    marginBottom: 8,
  },
});
