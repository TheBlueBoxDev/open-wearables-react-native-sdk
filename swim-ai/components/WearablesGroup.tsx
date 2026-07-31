import AsyncStorage from "@react-native-async-storage/async-storage";
import OpenWearablesHealthSDK, {
  HealthDataProvider,
  HealthDataType,
} from "open-wearables";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ProviderSetting,
  UserConnection,
  authorizeProvider,
  disconnectProvider,
} from "../api/cloud";
import { Group } from "./Group";
import { WearableProvider, buildProviders } from "./wearables/buildProviders";
import {
  CloudConnectModal,
  CloudConnectState,
} from "./wearables/CloudConnectModal";
import { ProviderActionsModal } from "./wearables/ProviderActionsModal";
import { ProviderRow } from "./wearables/ProviderRow";

const SYNC_IN_PROGRESS_KEY = "syncInProgress";
const LAST_SYNC_PREFIX = "lastSyncDate:";

/** iOS reports no providers — HealthKit is the only one. */
function getSdkProviders(): HealthDataProvider[] {
  const providers = OpenWearablesHealthSDK.getAvailableProviders();
  if (Platform.OS === "ios" && providers.length === 0) {
    return [{ id: "apple", displayName: "Apple Health", isAvailable: true }];
  }
  return providers;
}

function getSdkActiveProvider(): string | null {
  if (Platform.OS === "ios") {
    return OpenWearablesHealthSDK.isSyncActive() ? "apple" : null;
  }
  return OpenWearablesHealthSDK.getStoredCredentials()?.provider ?? null;
}

interface WearablesGroupProps {
  userId: string | null;
  apiProviders: ProviderSetting[];
  connections: UserConnection[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markPendingAuth: () => void;
  onToast: (message: string) => void;
}

export function WearablesGroup({
  userId,
  apiProviders,
  connections,
  loading,
  error,
  refetch,
  markPendingAuth,
  onToast,
}: WearablesGroupProps) {
  const [isSyncActive, setIsSyncActive] = useState(() =>
    Boolean(OpenWearablesHealthSDK.isSyncActive())
  );
  const [sdkActiveProviderId, setSdkActiveProviderId] = useState<string | null>(
    null
  );
  const [selectedProvider, setSelectedProvider] =
    useState<WearableProvider | null>(null);
  const [cloudConnect, setCloudConnect] = useState<
    (CloudConnectState & { providerId: string }) | null
  >(null);
  const [localSync, setLocalSync] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isConnectingRef = useRef(false);

  const sdkProviders = useMemo(getSdkProviders, []);

  useEffect(() => {
    setSdkActiveProviderId(getSdkActiveProvider());
  }, []);

  // Manual syncs are recorded locally — the server's last_synced_at can lag.
  const recordLocalSync = useCallback(async (providerId: string | null) => {
    if (providerId == null) return;
    const now = new Date().toISOString();
    setLocalSync((prev) => ({ ...prev, [providerId]: now }));
    await AsyncStorage.setItem(`${LAST_SYNC_PREFIX}${providerId}`, now);
  }, []);

  useEffect(() => {
    const loadLocalSync = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter((k) => k.startsWith(LAST_SYNC_PREFIX));
      if (syncKeys.length === 0) return;
      const entries = await AsyncStorage.multiGet(syncKeys);
      const stored: Record<string, string> = {};
      for (const [key, value] of entries) {
        if (value) stored[key.slice(LAST_SYNC_PREFIX.length)] = value;
      }
      setLocalSync(stored);
    };
    loadLocalSync();
  }, []);

  // Resume a sync that was interrupted while the app was closed
  useEffect(() => {
    const resumeInterruptedSync = async () => {
      const status = OpenWearablesHealthSDK.getSyncStatus();
      const wasInProgress = await AsyncStorage.getItem(SYNC_IN_PROGRESS_KEY);
      if (!status.hasResumableSession && !wasInProgress) return;

      setBusy(true);
      try {
        if (status.hasResumableSession) {
          const resumed = await OpenWearablesHealthSDK.resumeSync();
          if (!resumed) throw new Error("no session");
        } else {
          await OpenWearablesHealthSDK.syncNow();
        }
        await recordLocalSync(getSdkActiveProvider());
      } catch {
        // Resume/restart failed — ignore
      } finally {
        await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
        setBusy(false);
      }
    };
    resumeInterruptedSync();
  }, [recordLocalSync]);

  const providers = useMemo(() => {
    const built = buildProviders(
      sdkProviders,
      apiProviders,
      connections,
      isSyncActive,
      sdkActiveProviderId
    );
    return built.map((p) => {
      const local = localSync[p.id];
      if (local == null) return p;
      if (p.lastSyncedAt == null || new Date(local) > new Date(p.lastSyncedAt)) {
        return { ...p, lastSyncedAt: local };
      }
      return p;
    });
  }, [
    sdkProviders,
    apiProviders,
    connections,
    isSyncActive,
    sdkActiveProviderId,
    localSync,
  ]);

  const startNativeConnect = useCallback(
    async (provider: WearableProvider) => {
      if (!provider.isNative || isConnectingRef.current) return;
      isConnectingRef.current = true;
      setBusy(true);
      try {
        if (Platform.OS === "android") {
          if (!OpenWearablesHealthSDK.setProvider(provider.id)) {
            Alert.alert("Set provider error, check log");
            return;
          }
        }

        const authorized = await OpenWearablesHealthSDK.requestAuthorization(
          Object.values(HealthDataType)
        );
        if (!authorized) {
          Alert.alert(
            "Access denied",
            "Please grant health permissions to enable sync.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Retry", onPress: () => startNativeConnect(provider) },
            ]
          );
          return;
        }

        OpenWearablesHealthSDK.resetAnchors();
        await OpenWearablesHealthSDK.startBackgroundSync(30);
        setIsSyncActive(true);
        setSdkActiveProviderId(provider.id);
        onToast(`${provider.name} connected`);
        await refetch();
      } catch (e: any) {
        Alert.alert("Connect error", e?.message ?? String(e));
      } finally {
        isConnectingRef.current = false;
        setBusy(false);
      }
    },
    [onToast, refetch]
  );

  const startCloudConnect = useCallback(
    async (provider: WearableProvider) => {
      if (userId == null) return;
      setCloudConnect({
        providerId: provider.id,
        providerName: provider.name,
        authUrl: null,
        error: null,
        loading: true,
      });
      try {
        const res = await authorizeProvider(provider.id, userId);
        setCloudConnect({
          providerId: provider.id,
          providerName: provider.name,
          authUrl: res.authorization_url,
          error: null,
          loading: false,
        });
      } catch (e: any) {
        setCloudConnect({
          providerId: provider.id,
          providerName: provider.name,
          authUrl: null,
          error: e?.message ?? String(e),
          loading: false,
        });
      }
    },
    [userId]
  );

  const handleCloudConnect = useCallback(() => {
    if (cloudConnect?.authUrl == null) return;
    markPendingAuth();
    Linking.openURL(cloudConnect.authUrl);
    setCloudConnect(null);
  }, [cloudConnect, markPendingAuth]);

  const handleRowPress = (provider: WearableProvider) => {
    if (provider.status === "active") {
      setSelectedProvider(provider);
    } else if (provider.isNative && provider.hasCloudApi) {
      // Both paths are possible — let the user choose
      setSelectedProvider(provider);
    } else if (provider.hasCloudApi) {
      startCloudConnect(provider);
    } else {
      startNativeConnect(provider);
    }
  };

  const handleSyncNow = async () => {
    const provider = selectedProvider;
    if (provider == null) return;
    setSelectedProvider(null);
    setBusy(true);
    await AsyncStorage.setItem(SYNC_IN_PROGRESS_KEY, "true");
    try {
      await OpenWearablesHealthSDK.syncNow();
      await recordLocalSync(provider.id);
      onToast("Data synced");
    } catch (e: any) {
      Alert.alert("Sync error", e?.message ?? String(e));
    } finally {
      await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
      setBusy(false);
      await refetch();
    }
  };

  const handleDisconnect = async () => {
    const provider = selectedProvider;
    if (provider == null) return;
    setSelectedProvider(null);
    setBusy(true);
    try {
      if (provider.isNative) {
        await OpenWearablesHealthSDK.stopBackgroundSync();
        await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
        setIsSyncActive(false);
        setSdkActiveProviderId(null);
      }
      if (provider.connectionId != null && userId != null) {
        await disconnectProvider(userId, provider.id);
      }
      await AsyncStorage.removeItem(`${LAST_SYNC_PREFIX}${provider.id}`);
      setLocalSync((prev) => {
        const next = { ...prev };
        delete next[provider.id];
        return next;
      });
      onToast(`${provider.name} disconnected`);
    } catch (e: any) {
      Alert.alert("Disconnect error", e?.message ?? String(e));
    } finally {
      setBusy(false);
      await refetch();
    }
  };

  if (userId == null) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#8E8E93" />
        </View>
      );
    }

    if (error != null) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={refetch}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (providers.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No providers available</Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {providers.map((provider, index) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            hasBorderBottom={index < providers.length - 1}
            onPress={handleRowPress}
          />
        ))}
      </View>
    );
  };

  return (
    <Group
      name="Providers"
      description="Connect from this device or from your account"
    >
      {renderContent()}
      <ProviderActionsModal
        provider={selectedProvider}
        busy={busy}
        onClose={() => setSelectedProvider(null)}
        onSyncNow={handleSyncNow}
        onDisconnect={handleDisconnect}
        onNativeConnect={() => {
          const provider = selectedProvider;
          setSelectedProvider(null);
          if (provider) startNativeConnect(provider);
        }}
        onCloudConnect={() => {
          const provider = selectedProvider;
          setSelectedProvider(null);
          if (provider) startCloudConnect(provider);
        }}
      />
      <CloudConnectModal
        state={cloudConnect}
        onClose={() => setCloudConnect(null)}
        onConnect={handleCloudConnect}
      />
    </Group>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#38383A",
    overflow: "hidden",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#FF453A",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  retryButton: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
