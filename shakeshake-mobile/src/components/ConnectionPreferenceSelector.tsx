import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { connectionPreferences } from "../constants/homeData";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import type { ConnectionPreference } from "../types/home";

type ConnectionPreferenceSelectorProps = {
  selected: ConnectionPreference[];
  onChange: (prefs: ConnectionPreference[]) => void;
};

function toggle(list: ConnectionPreference[], item: ConnectionPreference): ConnectionPreference[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function ConnectionPreferenceSelector({ selected, onChange }: ConnectionPreferenceSelectorProps) {
  const { colors } = useThemeContext();

  const styles = StyleSheet.create({
    container: {
      gap: moderateScale(8),
      marginBottom: verticalScale(16),
    },
    label: {
      paddingLeft: moderateScale(16),
      fontSize: moderateScale(14),
      fontWeight: "800",
      color: colors.foreground,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(10),
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(10),
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.22,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    chipText: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.foreground,
    },
    chipTextSelected: {
      color: colors.white,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Who do you want to meet?</Text>
      <View style={styles.chipGrid}>
        {connectionPreferences.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(toggle(selected, p.id));
              }}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Feather name={p.icon} size={moderateScale(16)} color={isSelected ? colors.white : colors.foreground} />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
