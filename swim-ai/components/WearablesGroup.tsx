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
import { ConnectConfirmModal } from "./wearables/ConnectConfirmModal";
import { ProviderActionsModal } from "./wearables/ProviderActionsModal";
import { ProviderRow } from "./wearables/ProviderRow";

/** A connect the user has been asked to confirm, before anything happens. */
type ConnectPrompt = {
  provider: WearableProvider;
  kind: "native" | "cloud";
  authUrl: string | null;
  loading: boolean;
  error: string | null;
};

function promptMessage(prompt: ConnectPrompt): string {
  return prompt.kind === "cloud"
    ? `You will sign in to your ${prompt.provider.name} account to allow direct sync of your data`
    : `Your ${prompt.provider.name} data will be synced automatically from this device. You will be asked to grant health permissions.`;
}

/** iOS reports no providers — HealthKit is the only one. */
function getSdkProviders(): HealthDataProvider[] {
  const providers = OpenWearablesHealthSDK.getAvailableProviders();
  if (Platform.OS === "ios" && providers.length === 0) {
    return [{ id: "apple", displayName: "Apple Health", isAvailable: true }];
  }
  return providers;
}

/** The provider currently syncing through the SDK, or null when it is idle. */
function getSdkSyncingProvider(): string | null {
  if (!OpenWearablesHealthSDK.isSyncActive()) return null;
  if (Platform.OS === "ios") return "apple";
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
  const [selectedProvider, setSelectedProvider] =
    useState<WearableProvider | null>(null);
  const [connectPrompt, setConnectPrompt] = useState<ConnectPrompt | null>(
    null
  );
  const [sdkSyncingProviderId, setSdkSyncingProviderId] = useState<
    string | null
  >(null);
  const isConnectingRef = useRef(false);

  const sdkProviders = useMemo(getSdkProviders, []);

  const refreshSdkSyncing = useCallback(() => {
    setSdkSyncingProviderId(getSdkSyncingProvider());
  }, []);

  useEffect(refreshSdkSyncing, [refreshSdkSyncing, userId]);

  // Resume a sync that was interrupted while the app was closed
  useEffect(() => {
    const resumeInterruptedSync = async () => {
      if (!OpenWearablesHealthSDK.getSyncStatus().hasResumableSession) return;
      try {
        await OpenWearablesHealthSDK.resumeSync();
      } catch {
        // Resume failed — the SDK retries on its own schedule
      } finally {
        refreshSdkSyncing();
      }
    };
    resumeInterruptedSync();
  }, [refreshSdkSyncing]);

  const providers = useMemo(
    () =>
      buildProviders(
        sdkProviders,
        apiProviders,
        connections,
        sdkSyncingProviderId
      ),
    [sdkProviders, apiProviders, connections, sdkSyncingProviderId]
  );

  const runNativeConnect = useCallback(
    async (provider: WearableProvider) => {
      if (!provider.isNative || isConnectingRef.current) return;
      isConnectingRef.current = true;
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
        console.log("authorized: ", authorized);
        if (!authorized) {
          Alert.alert(
            "Access denied",
            "Please grant health permissions to enable sync.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Retry", onPress: () => runNativeConnect(provider) },
            ]
          );
          return;
        }

        OpenWearablesHealthSDK.resetAnchors();
        await OpenWearablesHealthSDK.startBackgroundSync(30);
        onToast(`${provider.name} connected`);
        await refetch();
      } catch (e: any) {
        Alert.alert("Connect error", e?.message ?? String(e));
      } finally {
        isConnectingRef.current = false;
        refreshSdkSyncing();
      }
    },
    [onToast, refetch, refreshSdkSyncing]
  );

  const promptNativeConnect = useCallback((provider: WearableProvider) => {
    setConnectPrompt({
      provider,
      kind: "native",
      authUrl: null,
      loading: false,
      error: null,
    });
  }, []);

  // The authorize call runs up front so the confirm dialog can report a
  // failure before sending the user out to the browser.
  const startCloudConnect = useCallback(
    async (provider: WearableProvider) => {
      if (userId == null) return;
      setConnectPrompt({
        provider,
        kind: "cloud",
        authUrl: null,
        loading: true,
        error: null,
      });
      try {
        const res = await authorizeProvider(provider.id, userId);
        setConnectPrompt({
          provider,
          kind: "cloud",
          authUrl: res.authorization_url,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        setConnectPrompt({
          provider,
          kind: "cloud",
          authUrl: null,
          loading: false,
          error: e?.message ?? String(e),
        });
      }
    },
    [userId]
  );

  const handleConfirmConnect = useCallback(() => {
    const prompt = connectPrompt;
    if (prompt == null) return;

    if (prompt.kind === "cloud") {
      if (prompt.authUrl == null) return;
      markPendingAuth();
      Linking.openURL(prompt.authUrl);
      setConnectPrompt(null);
      return;
    }

    setConnectPrompt(null);
    runNativeConnect(prompt.provider);
  }, [connectPrompt, markPendingAuth, runNativeConnect]);

  const handleRowPress = (provider: WearableProvider) => {
    if (provider.status === "active") {
      setSelectedProvider(provider);
    } else if (provider.isNative && provider.hasCloudApi) {
      // Both paths are possible — let the user choose
      setSelectedProvider(provider);
    } else if (provider.hasCloudApi) {
      startCloudConnect(provider);
    } else {
      promptNativeConnect(provider);
    }
  };

  const handleSyncNow = async () => {
    const provider = selectedProvider;
    if (provider == null) return;
    setSelectedProvider(null);
    try {
      await OpenWearablesHealthSDK.syncNow();
      onToast("Data synced");
    } catch (e: any) {
      Alert.alert("Sync error", e?.message ?? String(e));
    } finally {
      await refetch();
    }
  };

  const handleDisconnect = async () => {
    const provider = selectedProvider;
    if (provider == null) return;
    setSelectedProvider(null);
    try {
      // Only stop the SDK when this provider is the one it is syncing —
      // otherwise we would kill another provider's on-device sync.
      if (provider.isSdkConnected) {
        await OpenWearablesHealthSDK.stopBackgroundSync();
      }
      if (provider.connectionId != null && userId != null) {
        await disconnectProvider(userId, provider.id);
      }
      onToast(`${provider.name} disconnected`);
    } catch (e: any) {
      Alert.alert("Disconnect error", e?.message ?? String(e));
    } finally {
      refreshSdkSyncing();
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
        {providers.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
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
        onClose={() => setSelectedProvider(null)}
        onSyncNow={handleSyncNow}
        onDisconnect={handleDisconnect}
        onNativeConnect={() => {
          const provider = selectedProvider;
          setSelectedProvider(null);
          if (provider) promptNativeConnect(provider);
        }}
        onCloudConnect={() => {
          const provider = selectedProvider;
          setSelectedProvider(null);
          if (provider) startCloudConnect(provider);
        }}
      />
      <ConnectConfirmModal
        state={
          connectPrompt && {
            providerName: connectPrompt.provider.name,
            message: promptMessage(connectPrompt),
            loading: connectPrompt.loading,
            error: connectPrompt.error,
          }
        }
        onClose={() => setConnectPrompt(null)}
        onConfirm={handleConfirmConnect}
      />
    </Group>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
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
