import { StyleSheet, TextInput, TextInputProps } from "react-native";

export function Input(props: TextInputProps) {
  return (
    <TextInput placeholderTextColor="#48484A" style={styles.input} {...props} />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#38383A",
    borderRadius: 8,
    color: "#FFFFFF",
    backgroundColor: "#2C2C2E",
  },
});
