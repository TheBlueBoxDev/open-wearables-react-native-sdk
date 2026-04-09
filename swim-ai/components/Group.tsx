import { StyleSheet, Text, View } from "react-native";

interface GroupProps {
  name?: string;
  description?: string;
  children: React.ReactNode;
}

export function Group({ name, description, children }: GroupProps) {
  return (
    <View style={styles.group}>
      {name != null && <Text style={styles.groupHeader}>{name.toUpperCase()}</Text>}
      {description != null && <Text style={styles.groupDescription}>{description}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  groupHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#8E8E93",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 13,
    color: "#636366",
    marginBottom: 10,
  },
  group: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    gap: 0,
  },
});
