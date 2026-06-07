import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";

type CalendarPermissionGateProps = {
  onRequestPermission: () => void;
  isDenied: boolean;
};

export function CalendarPermissionGate({ onRequestPermission, isDenied }: CalendarPermissionGateProps) {
  const { colors } = useThemeContext();

  const styles = StyleSheet.create({
    container: {
      borderRadius: moderateScale(20),
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      padding: moderateScale(24),
      alignItems: "center",
      gap: moderateScale(12),
      marginBottom: verticalScale(16),
    },
    title: {
      fontSize: moderateScale(18),
      fontWeight: "800",
      color: colors.foreground,
    },
    description: {
      fontSize: moderateScale(14),
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: moderateScale(20),
    },
    button: {
      marginTop: verticalScale(4),
      minWidth: moderateScale(180),
    },
  });

  return (
    <View style={styles.container}>
      <Feather name="calendar" size={moderateScale(40)} color={colors.primary} />
      <Text style={styles.title}>Connect Your Calendar</Text>
      <Text style={styles.description}>
        {isDenied
          ? "Calendar access was denied. Go to Settings → ShakeShake → enable Calendars."
          : "ShakeShake wants to show your schedule so you can find time to meet new people."}
      </Text>
      <AppButton
        title={isDenied ? "Open Settings" : "Enable Calendar"}
        onPress={onRequestPermission}
        variant="primary"
        style={styles.button}
      />
    </View>
  );
}
