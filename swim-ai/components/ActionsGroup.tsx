import OpenWearablesHealthSDK from "open-wearables";
import { Alert } from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";

interface ActionsGroupProps {
  onDisconnect: () => void;
}

export function ActionsGroup({ onDisconnect }: ActionsGroupProps) {
  const signOut = async () => {
    try {
      onDisconnect();
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
