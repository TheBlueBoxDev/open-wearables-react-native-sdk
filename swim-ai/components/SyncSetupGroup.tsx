import { Ionicons } from "@expo/vector-icons";
import OpenWearablesHealthSDK from "open-wearables";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";

interface SyncSetupGroupProps {
  onSyncStarted: () => void;
  onToast: (message: string) => void;
}

export function SyncSetupGroup({
  onSyncStarted,
  onToast,
}: SyncSetupGroupProps) {
  const [mode, setMode] = useState<"choose" | "history">("choose");
  const [daysBack, setDaysBack] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const startSync = async (days: number) => {
    setIsStarting(true);
    try {
      OpenWearablesHealthSDK.resetAnchors();
      await OpenWearablesHealthSDK.startBackgroundSync(days);
      onSyncStarted();
      onToast("Sync started");
    } catch (e: any) {
      Alert.alert("Sync error", e?.message ?? String(e));
    } finally {
      setIsStarting(false);
    }
  };

  const handleDaysChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric === "") {
      setDaysBack("");
      return;
    }
    const value = Math.min(parseInt(numeric, 10), 30);
    setDaysBack(String(value));
  };

  const isValidDays =
    daysBack.length > 0 &&
    parseInt(daysBack, 10) >= 1 &&
    parseInt(daysBack, 10) <= 30;

  if (mode === "choose") {
    return (
      <Group name="Sync Setup">
        <ActionRow
          title="Start fresh"
          description="Start sending data from today onwards"
          iconName="flash-outline"
          iconBgColor="#1A3D1A"
          onPress={() => startSync(1)}
          hasBorderBottom
        />
        <ActionRow
          title="Upload my data"
          description="Sync historical health data"
          iconName="time-outline"
          iconBgColor="#0A2D5C"
          onPress={() => setMode("history")}
        />
      </Group>
    );
  }

  return (
    <Group name="Sync Setup">
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.input}
            onChangeText={handleDaysChange}
            value={daysBack}
            placeholder="Number of days (1-30)"
            placeholderTextColor="#48484A"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
      <Pressable
        onPress={() => startSync(parseInt(daysBack, 10))}
        disabled={!isValidDays || isStarting}
        style={({ pressed }) => [
          styles.button,
          styles.startButton,
          (!isValidDays || isStarting) && styles.buttonDisabled,
          pressed && isValidDays && !isStarting && styles.buttonPressed,
        ]}
      >
        <Text style={styles.startButtonText}>
          {isStarting ? "Starting..." : "Start Sync"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setMode("choose");
          setDaysBack("");
        }}
        style={({ pressed }) => [
          styles.button,
          styles.cancelButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </Group>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#30D158",
    marginBottom: 8,
  },
  startButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#2C2C2E",
  },
  cancelButtonText: {
    color: "#8E8E93",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
