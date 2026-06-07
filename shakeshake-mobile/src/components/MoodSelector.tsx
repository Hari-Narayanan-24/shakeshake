import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { moodOptions } from "../constants/homeData";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import type { MoodOption } from "../types/home";

type MoodSelectorProps = {
  selectedMoods: MoodOption[];
  onChange: (moods: MoodOption[]) => void;
};

function toggle(list: MoodOption[], item: MoodOption): MoodOption[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function MoodSelector({ selectedMoods, onChange }: MoodSelectorProps) {
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
    chipRow: {
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
    emoji: {
      fontSize: moderateScale(16),
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
      <Text style={styles.label}>How are you feeling?</Text>
      <View style={styles.chipRow}>
        {moodOptions.map((m) => {
          const selected = selectedMoods.includes(m.id);
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(toggle(selectedMoods, m.id));
              }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
