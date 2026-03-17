import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ActionRowProps {
  title: string;
  description?: string;
  iconName: string;
  iconBgColor: string;
  onPress: () => void;
  titleColor?: string;
  hasBorderBottom?: boolean;
}

export function ActionRow({
  title,
  description,
  iconName,
  iconBgColor,
  onPress,
  titleColor = "#FFFFFF",
  hasBorderBottom = false,
}: ActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        hasBorderBottom && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName as any} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {description != null && <Text style={styles.description}>{description}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#48484A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#38383A",
    marginBottom: 0,
  },
  rowPressed: {
    opacity: 0.6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    color: "#8E8E93",
  },
});
