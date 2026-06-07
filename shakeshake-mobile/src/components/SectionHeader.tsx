import { StyleSheet, Text, View } from "react-native";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

type SectionHeaderProps = {
  title: string;
  subtitle: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const { colors } = useThemeContext();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(28),
  },
  title: {
    fontSize: moderateScale(36),
    lineHeight: moderateScale(43),
    fontWeight: "800",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(17),
    lineHeight: moderateScale(25),
  },
});
