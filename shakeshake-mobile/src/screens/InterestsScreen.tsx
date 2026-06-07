import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { ProgressSteps } from "../components/ProgressSteps";
import { ScreenShell } from "../components/ScreenShell";
import { SectionHeader } from "../components/SectionHeader";
import {
  gameGenres,
  hobbies,
  movieGenres,
  musicGenres,
  tvGenres,
} from "../constants/onboardingData";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type { InterestForm } from "../types/onboarding";

type InterestsScreenProps = {
  interestForm: InterestForm;
  onChangeInterest: (data: InterestForm) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
};

function toggleItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

export function InterestsScreen({
  interestForm,
  onChangeInterest,
  onBack,
  onContinue,
  loading,
}: InterestsScreenProps) {
  const { colors } = useThemeContext();
  const canContinue = interestForm.hobbies.length >= 1;

  const styles = StyleSheet.create({
    fieldBlock: {
      gap: moderateScale(8),
      marginBottom: verticalScale(20),
    },
    label: {
      paddingLeft: moderateScale(16),
      fontSize: moderateScale(14),
      fontWeight: "800",
      color: colors.foreground,
    },
    required: {
      color: colors.primary,
      fontSize: moderateScale(12),
    },
    optional: {
      fontWeight: "600",
      color: colors.mutedForeground,
      fontSize: moderateScale(12),
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(10),
    },
    chip: {
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      paddingHorizontal: moderateScale(18),
      paddingVertical: moderateScale(10),
    },
    hobbyChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      paddingHorizontal: moderateScale(16),
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
    pressed: {
      transform: [{ scale: 0.97 }],
    },
    chipText: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: colors.foreground,
    },
    chipTextSelected: {
      color: colors.white,
    },
    footerActions: {
      marginTop: "auto",
      flexDirection: "row",
      gap: moderateScale(12),
    },
    backButton: {
      minWidth: moderateScale(105),
    },
    flexButton: {
      flex: 1,
    },
  });

  return (
    <ScreenShell>
      <ProgressSteps activeStep={3} totalSteps={4} />
      <SectionHeader
        title="What are you into?"
        subtitle="Pick your hobbies and tell us what you like"
      />

      {/* ── Hobbies (required — at least 1) ───────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          Hobbies <Text style={styles.required}>(pick at least 1)</Text>
        </Text>
        <View style={styles.chipGrid}>
          {hobbies.map((h) => {
            const selected = interestForm.hobbies.includes(h.id);
            return (
              <Pressable
                key={h.id}
                onPress={() => onChangeInterest({ ...interestForm, hobbies: toggleItem(interestForm.hobbies, h.id) })}
                style={({ pressed }) => [
                  styles.hobbyChip,
                  selected && styles.chipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Feather name={h.icon} size={moderateScale(18)} color={selected ? colors.white : colors.foreground} />
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{h.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Music ─────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Music you like <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {musicGenres.map((m) => {
            const selected = interestForm.music.includes(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => onChangeInterest({ ...interestForm, music: toggleItem(interestForm.music, m.id) })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Movies ────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Films you like <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {movieGenres.map((m) => {
            const selected = interestForm.movies.includes(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => onChangeInterest({ ...interestForm, movies: toggleItem(interestForm.movies, m.id) })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── TV ────────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Shows you like <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {tvGenres.map((t) => {
            const selected = interestForm.tv.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => onChangeInterest({ ...interestForm, tv: toggleItem(interestForm.tv, t.id) })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Games ─────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Games you like <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {gameGenres.map((g) => {
            const selected = interestForm.games.includes(g.id);
            return (
              <Pressable
                key={g.id}
                onPress={() => onChangeInterest({ ...interestForm, games: toggleItem(interestForm.games, g.id) })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Back + Continue ────────────────────────────────────── */}
      <View style={styles.footerActions}>
        <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backButton} />
        <AppButton
          title="Continue"
          onPress={onContinue}
          disabled={!canContinue}
          loading={loading}
          style={styles.flexButton}
        />
      </View>
    </ScreenShell>
  );
}
