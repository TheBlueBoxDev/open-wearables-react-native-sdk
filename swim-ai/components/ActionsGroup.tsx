import AsyncStorage from "@react-native-async-storage/async-storage";
import OpenWearablesHealthSDK, { HealthDataType } from "open-wearables";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";

const LAST_SYNC_KEY = "lastSyncDate";
const SYNC_IN_PROGRESS_KEY = "syncInProgress";

function formatSyncDate(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `Last sync on ${y}/${mo}/${d} at ${h}:${mi}:${s}`;
}

interface ActionsGroupProps {
  isAuthorized: boolean | null;
  isSyncActive: boolean;
  onAuthChange: (authorized: boolean) => void;
  onSyncChange: (active: boolean) => void;
  onDisconnect: () => void;
  onToast: (message: string) => void;
}

export function ActionsGroup({
  isAuthorized,
  isSyncActive,
  onAuthChange,
  onSyncChange,
  onDisconnect,
  onToast,
}: ActionsGroupProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((val) => {
      if (val) setLastSyncDate(new Date(val));
    });
  }, []);

  // Resume interrupted sync if one exists
  useEffect(() => {
    const checkInterruptedSync = async () => {
      const status = OpenWearablesHealthSDK.getSyncStatus();
      const wasInProgress = await AsyncStorage.getItem(SYNC_IN_PROGRESS_KEY);

      if (!status.hasResumableSession && !wasInProgress) return;

      setIsSyncing(true);
      try {
        if (status.hasResumableSession) {
          const resumed = await OpenWearablesHealthSDK.resumeSync();
          if (!resumed) throw new Error("no session");
        } else {
          await OpenWearablesHealthSDK.syncNow();
        }
        const now = new Date();
        setLastSyncDate(now);
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      } catch {
        // Resume/restart failed — ignore
      } finally {
        await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
        setIsSyncing(false);
      }
    };
    checkInterruptedSync();
  }, []);

  const requestAuthorization = async () => {
    const granted = await OpenWearablesHealthSDK.requestAuthorization(
      Object.values(HealthDataType)
    );
    onAuthChange(granted);
    if (granted) {
      onToast("Authorized");
    } else {
      Alert.alert(
        "Access denied",
        "Please grant health permissions to enable sync."
      );
    }
  };

  const stopSync = async () => {
    await OpenWearablesHealthSDK.stopBackgroundSync();
    onSyncChange(false);
  };

  const syncNow = async () => {
    setIsSyncing(true);
    await AsyncStorage.setItem(SYNC_IN_PROGRESS_KEY, "true");
    try {
      await OpenWearablesHealthSDK.syncNow();
      const now = new Date();
      setLastSyncDate(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      onToast("Data synced");
    } catch {
      // Sync failed — silently ignore
    } finally {
      await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
      setIsSyncing(false);
    }
  };

  const signOut = async () => {
    try {
      onDisconnect();
      await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
      await OpenWearablesHealthSDK.signOut();
    } catch (e: any) {
      Alert.alert("Sign out error", e?.message ?? String(e));
    }
  };

  return (
    <Group>
      {isAuthorized !== true ? (
        <>
          <ActionRow
            title="Authorize Health"
            description="Grant access to health data"
            iconName="heart-outline"
            iconBgColor="#3A3A3C"
            onPress={requestAuthorization}
            hasBorderBottom
          />
          <ActionRow
            title="Disconnect"
            description="Sign out and stop syncing"
            iconName="exit-outline"
            iconBgColor="#5C1A1A"
            titleColor="#FF453A"
            onPress={signOut}
          />
        </>
      ) : (
        <>
          {isSyncActive && (
            <>
              <ActionRow
                title="Stop Sync"
                description="Background sync is active"
                iconName="pause"
                iconBgColor="#1A3D1A"
                onPress={stopSync}
                hasBorderBottom
              />
              <ActionRow
                title="Sync Now"
                description={
                  isSyncing
                    ? "Syncing..."
                    : lastSyncDate
                      ? formatSyncDate(lastSyncDate)
                      : "Not synced yet"
                }
                iconName="sync-outline"
                iconBgColor="#0A2D5C"
                onPress={syncNow}
                loading={isSyncing}
                disabled={isSyncing}
                hasBorderBottom
              />
            </>
          )}
          <ActionRow
            title="Disconnect"
            description="Sign out and stop syncing"
            iconName="exit-outline"
            iconBgColor="#5C1A1A"
            titleColor="#FF453A"
            onPress={signOut}
          />
        </>
      )}
    </Group>
  );
}
