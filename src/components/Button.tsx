import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    type === "primary" && styles.primaryButton,
    type === "secondary" && styles.secondaryButton,
    type === "danger" && styles.dangerButton,
    disabled && styles.disabledButton,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    type === "primary" && styles.primaryButtonText,
    type === "secondary" && styles.secondaryButtonText,
    type === "danger" && styles.dangerButtonText,
    disabled && styles.disabledButtonText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={type === "secondary" ? "#4a80f5" : "white"} />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: "#4a80f5",
  },
  secondaryButton: {
    backgroundColor: "rgba(74, 128, 245, 0.1)",
    borderWidth: 1,
    borderColor: "#4a80f5",
  },
  dangerButton: {
    backgroundColor: "rgba(220, 53, 69, 0.8)",
  },
  disabledButton: {
    backgroundColor: "#1a2151",
    borderColor: "#232b4a",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  primaryButtonText: {
    color: "white",
  },
  secondaryButtonText: {
    color: "white",
  },
  dangerButtonText: {
    color: "white",
  },
  disabledButtonText: {
    color: "#ffffff",
    opacity: 0.6,
  },
});

export default Button;
