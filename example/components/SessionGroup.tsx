import { Ionicons } from "@expo/vector-icons";
import OpenWearablesHealthSDK from "open-wearables";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Group } from "./Group";

interface SessionGroupProperties {
  credentials: Record<string, any>;
  onConnectSuccess?: () => void;
}

export function SessionGroup({
  credentials,
  onConnectSuccess,
}: SessionGroupProperties) {
  const [hostInput, setHostInput] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (credentials.host) {
      setHostInput(credentials.host);
    }
  }, [credentials]);

  const connect = async () => {
    setConnecting(true);
    try {
      OpenWearablesHealthSDK.configure(hostInput);

      const response = await fetch(
        `${hostInput}/api/v1/invitation-code/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: invitationCode }),
        }
      );

      if (!response.ok) {
        const res = await response.json();
        Alert.alert("Connect failed", res.detail || `HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      const userId = data.user_id as string | null;
      const accessToken = data.access_token as string | null;
      const refreshToken = data.refresh_token as string | null;
      if (userId == null || accessToken == null || refreshToken == null)
        throw new Error("Invalid response from server");

      const bearerToken = accessToken.startsWith("Bearer ")
        ? accessToken
        : `Bearer ${accessToken}`;

      await OpenWearablesHealthSDK.signIn(
        userId,
        bearerToken,
        refreshToken,
        null
      );
      onConnectSuccess?.();
    } catch (e: any) {
      Alert.alert("Connect error", e?.message ?? String(e));
    } finally {
      setConnecting(false);
    }
  };

  const canConnect = !connecting && invitationCode.length > 0;

  return (
    <Group name="Connect">
      <View style={styles.inputsContainer}>
        <View style={styles.inputRow}>
          <Ionicons name="globe-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.input}
            onChangeText={setHostInput}
            value={hostInput}
            placeholder="Host URL"
            placeholderTextColor="#48484A"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.inputRow}>
          <Ionicons name="ticket-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.input}
            onChangeText={setInvitationCode}
            value={invitationCode}
            placeholder="Invitation Code"
            placeholderTextColor="#48484A"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>
      <Pressable
        onPress={connect}
        disabled={!canConnect}
        style={({ pressed }) => [
          styles.connectButton,
          !canConnect && styles.connectButtonDisabled,
          pressed && canConnect && styles.connectButtonPressed,
        ]}
      >
        <Text style={styles.connectButtonText}>
          {connecting ? "Connecting…" : "Connect"}
        </Text>
      </Pressable>
    </Group>
  );
}

const styles = StyleSheet.create({
  inputsContainer: {
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#38383A",
    marginLeft: 42,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  connectButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  connectButtonDisabled: {
    opacity: 0.45,
  },
  connectButtonPressed: {
    opacity: 0.85,
  },
  connectButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
