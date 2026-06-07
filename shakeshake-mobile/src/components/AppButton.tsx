import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { moderateScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

type ButtonVariant = "primary" | "secondary" | "outline" | "white";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  leftIcon?: ReactNode;
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  leftIcon,
}: AppButtonProps) {
  const { colors } = useThemeContext();
  const isDisabled = disabled || loading;
  const textStyle =
    variant === "white"
      ? { color: colors.primary }
      : variant === "outline"
        ? { color: colors.foreground }
        : variant === "secondary"
          ? { color: colors.white }
          : { color: colors.white };

  const variantStyle =
    variant === "white"
      ? { backgroundColor: colors.white, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 6 }
      : variant === "primary"
        ? { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 6 }
        : variant === "secondary"
          ? { backgroundColor: "rgba(255,255,255,0.22)", borderWidth: 2, borderColor: "rgba(255,255,255,0.42)" }
          : { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.border };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.primary} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: moderateScale(56),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(24),
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
});
