import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import OpenWearablesHealthSDK from "open-wearables";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActionsGroup } from "./components/ActionsGroup";
import { SessionGroup } from "./components/SessionGroup";
import { Toast } from "./components/Toast";
import { WearablesGroup } from "./components/WearablesGroup";
import { useLogs } from "./hooks/useLogs";
import { useWearables } from "./hooks/useWearables";
import { LogsScreen } from "./screens/LogsScreen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const onAuthErrorPayload = useEvent(OpenWearablesHealthSDK, "onAuthError");
  const [credentials, setCredentials] = useState<Record<string, any>>({});
  const [showLogs, setShowLogs] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(
    null
  );
  const { logs, clearLogs } = useLogs();
  const userId = credentials.userId ?? null;
  const wearables = useWearables(userId);

  // `userId` drives every server call, so fall back to the stored session when
  // the credentials map doesn't carry it.
  const refreshStoredCredentials = () => {
    const stored = { ...(OpenWearablesHealthSDK.getStoredCredentials() ?? {}) };
    if (!stored.userId) {
      const restored = OpenWearablesHealthSDK.restoreSession() as string | null;
      if (restored) stored.userId = restored;
    }
    setCredentials(stored);
  };

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_HOST_URL) {
      OpenWearablesHealthSDK.configure(process.env.EXPO_PUBLIC_HOST_URL);
    }
    refreshStoredCredentials();
    setIsConnected(Boolean(OpenWearablesHealthSDK.isSessionValid()));
  }, []);

  useEffect(() => {
    if (!onAuthErrorPayload) return;
    Alert.alert(onAuthErrorPayload.message);
  }, [onAuthErrorPayload]);

  const handleRefresh = async () => {
    refreshStoredCredentials();
    await wearables.refetch();
  };

  const showToast = (message: string) => {
    setToast({ message, key: Date.now() });
  };

  const handleConnectSuccess = () => {
    refreshStoredCredentials();
    setIsConnected(true);
    showToast("Connected successfully");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    refreshStoredCredentials();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Modal
          visible={showLogs}
          animationType="slide"
          onRequestClose={() => setShowLogs(false)}
        >
          <LogsScreen
            logs={logs}
            onClearLogs={clearLogs}
            onBack={() => setShowLogs(false)}
          />
        </Modal>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Swim AI</Text>
            <Pressable onPress={() => setShowLogs(true)} hitSlop={8}>
              <View style={styles.logsButton}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#8E8E93"
                />
                {logs.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {logs.length > 99 ? "99+" : logs.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            style={styles.scroll}
            keyboardShouldPersistTaps="always"
            refreshControl={
              <RefreshControl
                refreshing={wearables.refreshing}
                onRefresh={handleRefresh}
                tintColor="#8E8E93"
              />
            }
          >
            {isConnected === false ? (
              <SessionGroup onConnectSuccess={handleConnectSuccess} />
            ) : (
              <>
                <WearablesGroup
                  userId={userId}
                  apiProviders={wearables.apiProviders}
                  connections={wearables.connections}
                  loading={wearables.loading}
                  error={wearables.error}
                  refetch={wearables.refetch}
                  markPendingAuth={wearables.markPendingAuth}
                  onToast={showToast}
                />
                <ActionsGroup onDisconnect={handleDisconnect} />
              </>
            )}
            {toast != null && (
              <Toast
                key={toast.key}
                message={toast.message}
                onHide={() => setToast(null)}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logsButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#FF453A",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    gap: 16,
    padding: 20,
    paddingTop: 4,
  },
});
