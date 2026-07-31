import AsyncStorage from "@react-native-async-storage/async-storage";
import OpenWearablesHealthSDK from "open-wearables";
import { Alert } from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";

const SYNC_IN_PROGRESS_KEY = "syncInProgress";

interface ActionsGroupProps {
  onDisconnect: () => void;
}

export function ActionsGroup({ onDisconnect }: ActionsGroupProps) {
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
      <ActionRow
        title="Disconnect"
        description="End the session and stop syncing"
        iconName="exit-outline"
        iconBgColor="#5C1A1A"
        titleColor="#FF453A"
        onPress={signOut}
      />
    </Group>
  );
}
