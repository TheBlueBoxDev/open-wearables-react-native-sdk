import { HealthDataProvider } from "open-wearables";
import { Platform } from "react-native";
import {
  ConnectionStatus,
  ProviderSetting,
  UserConnection,
  iconUrl,
} from "../../api/cloud";

export type WearableProvider = {
  id: string;
  name: string;
  iconUrl: string | null;
  status: ConnectionStatus;
  connectionId: string | null;
  lastSyncedAt: string | null;
  isNative: boolean;
  /** Connected through the SDK on this device, as opposed to server-side. */
  isSdkConnected: boolean;
  isDisabled: boolean;
  hasCloudApi: boolean;
  disabledReason: string | null;
};

/**
 * Merges what the SDK offers on this device with what the server knows about
 * the user, producing a single list where each provider carries its own status.
 *
 * Status and last-sync always come from the connections service — it is the
 * real state, including when a provider has been revoked server-side.
 *
 * `sdkSyncingProviderId` is a different question: which provider, if any, is
 * currently syncing through the SDK. It decides which rows are connected *on
 * this device* rather than server-side.
 */
export function buildProviders(
  sdkProviders: HealthDataProvider[],
  apiProviders: ProviderSetting[],
  connections: UserConnection[],
  sdkSyncingProviderId: string | null
): WearableProvider[] {
  const isIOS = Platform.OS === "ios";

  // provider → best connection (prefer an active one)
  const connectionMap = new Map<string, UserConnection>();
  for (const conn of connections) {
    const existing = connectionMap.get(conn.provider);
    if (!existing || (conn.status === "active" && existing.status !== "active")) {
      connectionMap.set(conn.provider, conn);
    }
  }

  const sdkProviderMap = new Map<string, HealthDataProvider>();
  for (const p of sdkProviders) {
    sdkProviderMap.set(p.id, p);
  }

  // Which provider ids can be read from this device
  const nativeProviderIds = new Set<string>(
    isIOS ? ["apple"] : sdkProviders.map((p) => p.id)
  );

  // The provider occupying the SDK — only one can sync on-device at a time.
  // Used for the "disconnect X first" hints.
  const activeNativeProvider: ProviderSetting | null =
    apiProviders.find((p) => p.provider === sdkSyncingProviderId) ?? null;

  const nativeProviders: WearableProvider[] = apiProviders
    .filter((p) => {
      if (!nativeProviderIds.has(p.provider) || !p.is_enabled) return false;
      return isIOS ? true : sdkProviderMap.get(p.provider)?.isAvailable ?? false;
    })
    .map((p) => {
      const conn = connectionMap.get(p.provider);
      const status: ConnectionStatus = conn?.status ?? "not-connected";
      const anotherNativeActive =
        activeNativeProvider != null &&
        activeNativeProvider.provider !== p.provider &&
        status !== "active";

      let isDisabled = false;
      let disabledReason: string | null = null;

      if (anotherNativeActive && p.has_cloud_api) {
        // Still tappable — the cloud path remains available
        disabledReason = `Disconnect ${activeNativeProvider!.name} to use this option`;
      } else if (anotherNativeActive) {
        isDisabled = true;
        disabledReason = `Disconnect ${activeNativeProvider!.name} to connect ${p.name}`;
      }

      return {
        id: p.provider,
        name: p.name,
        iconUrl: iconUrl(p),
        status,
        connectionId: conn?.id ?? null,
        lastSyncedAt: conn?.last_synced_at ?? null,
        isNative: true,
        isSdkConnected: sdkSyncingProviderId === p.provider,
        isDisabled,
        hasCloudApi: p.has_cloud_api,
        disabledReason,
      };
    });

  const nativeIds = new Set(nativeProviders.map((p) => p.id));

  const cloudProviders: WearableProvider[] = apiProviders
    .filter((p) => p.has_cloud_api && p.is_enabled && !nativeIds.has(p.provider))
    .map((p) => {
      const conn = connectionMap.get(p.provider);
      return {
        id: p.provider,
        name: p.name,
        iconUrl: iconUrl(p),
        status: conn?.status ?? "not-connected",
        connectionId: conn?.id ?? null,
        lastSyncedAt: conn?.last_synced_at ?? null,
        isNative: false,
        isSdkConnected: false,
        isDisabled: false,
        hasCloudApi: true,
        disabledReason: null,
      };
    });

  return [...nativeProviders, ...cloudProviders];
}
