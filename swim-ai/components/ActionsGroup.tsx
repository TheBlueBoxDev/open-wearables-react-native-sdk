import OpenWearablesHealthSDK, { HealthDataType } from "open-wearables";
import { Alert } from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";

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

  const toggleSync = async () => {
    if (isSyncActive) {
      await OpenWearablesHealthSDK.stopBackgroundSync();
      onSyncChange(false);
    } else {
      const started = await OpenWearablesHealthSDK.startBackgroundSync(null);
      onSyncChange(started ? started : true);
      onToast("Sync started");
    }
  };

  const syncNow = async () => {
    await OpenWearablesHealthSDK.syncNow();
    onToast("Data synced");
  };

  const signOut = async () => {
    try {
      await OpenWearablesHealthSDK.signOut();
      onDisconnect();
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
          <ActionRow
            title={isSyncActive ? "Stop Sync" : "Start Sync"}
            description={
              isSyncActive
                ? "Background sync is active"
                : "Begin syncing health data"
            }
            iconName={isSyncActive ? "pause" : "play"}
            iconBgColor="#1A3D1A"
            onPress={toggleSync}
            hasBorderBottom
          />
          <ActionRow
            title="Sync Now"
            description="Force an immediate sync"
            iconName="sync-outline"
            iconBgColor="#0A2D5C"
            onPress={syncNow}
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
      )}
    </Group>
  );
}
