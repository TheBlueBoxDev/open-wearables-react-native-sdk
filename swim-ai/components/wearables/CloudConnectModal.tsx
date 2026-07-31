import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type CloudConnectState = {
  providerName: string;
  authUrl: string | null;
  error: string | null;
  loading: boolean;
};

interface CloudConnectModalProps {
  state: CloudConnectState | null;
  onClose: () => void;
  onConnect: () => void;
}

export function CloudConnectModal({
  state,
  onClose,
  onConnect,
}: CloudConnectModalProps) {
  const renderBody = () => {
    if (state == null) return null;

    if (state.loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#8E8E93" />
        </View>
      );
    }

    if (state.error != null) {
      return (
        <>
          <Text style={styles.errorText}>{state.error}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </Pressable>
        </>
      );
    }

    return (
      <>
        <Text style={styles.title}>Connect {state.providerName}</Text>
        <Text style={styles.body}>
          You will sign in to your {state.providerName} account to allow direct
          sync of your data
        </Text>
        <View style={styles.buttons}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              styles.buttonFlex,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onConnect}
            style={({ pressed }) => [
              styles.button,
              styles.connectButton,
              styles.buttonFlex,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={state != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {renderBody()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    minHeight: 140,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    padding: 20,
    justifyContent: "center",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#FF453A",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFlex: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#2C2C2E",
  },
  cancelButtonText: {
    color: "#8E8E93",
    fontSize: 15,
    fontWeight: "600",
  },
  connectButton: {
    backgroundColor: "#0A84FF",
  },
  connectButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
