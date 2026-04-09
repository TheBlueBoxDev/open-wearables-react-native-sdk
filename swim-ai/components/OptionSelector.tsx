import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type SelectorOption = {
  id: string;
  title: string;
  description?: string;
  disabled?: boolean;
  iconName?: string;
  iconBgColor?: string;
};

interface OptionSelectorProps {
  options: SelectorOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OptionSelector({ options, selectedId, onSelect }: OptionSelectorProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = option.id === selectedId;
        const isLast = index === options.length - 1;

        return (
          <Pressable
            key={option.id}
            style={({ pressed }) => [
              styles.row,
              !isLast && styles.rowBorder,
              option.disabled && styles.rowDisabled,
              pressed && !option.disabled && styles.rowPressed,
            ]}
            onPress={() => !option.disabled && onSelect(option.id)}
            disabled={option.disabled}
          >
            {option.iconName != null && (
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: option.iconBgColor ?? "#3A3A3C" },
                ]}
              >
                <Ionicons
                  name={option.iconName as any}
                  size={20}
                  color={option.disabled ? "#555558" : "#FFFFFF"}
                />
              </View>
            )}
            <View style={styles.content}>
              <Text style={[styles.title, option.disabled && styles.textDisabled]}>
                {option.title}
              </Text>
              {option.description != null && (
                <Text style={[styles.description, option.disabled && styles.textDisabled]}>
                  {option.description}
                </Text>
              )}
            </View>
            <View style={[styles.circle, isSelected && styles.circleSelected]}>
              {isSelected && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#38383A",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#2C2C2E",
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#38383A",
  },
  rowDisabled: {
    backgroundColor: "#1C1C1E",
  },
  rowPressed: {
    backgroundColor: "#3A3A3C",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    color: "#8E8E93",
  },
  textDisabled: {
    color: "#48484A",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#48484A",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  circleSelected: {
    borderColor: "#0A84FF",
    backgroundColor: "#0A84FF",
  },
});
