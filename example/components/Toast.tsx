import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ToastProps {
  message: string;
  onHide: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle-outline" size={20} color="#30D158" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F2E1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A5C30",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: "#30D158",
    fontSize: 15,
    fontWeight: "600",
  },
});
