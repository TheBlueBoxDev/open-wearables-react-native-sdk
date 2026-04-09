import { Pressable, StyleSheet, Text } from "react-native";

export const Colors = {
  primary: "#0A84FF",
  destructive: "#FF453A",
  positive: "#30D158",
  muted: "#636366",
};

type Props = {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  color = Colors.primary,
  disabled = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
