import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { ProgressSteps } from "../components/ProgressSteps";
import { ScreenShell } from "../components/ScreenShell";
import { SectionHeader } from "../components/SectionHeader";
import { genders, orientations, religionOpenness, religions } from "../constants/onboardingData";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type {
  GenderOption,
  IdentityForm,
  OrientationOption,
  ReligionOpennessOption,
  ReligionOption,
} from "../types/onboarding";

type IdentityScreenProps = {
  identityForm: IdentityForm;
  onChangeIdentity: (data: IdentityForm) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
};

export function IdentityScreen({
  identityForm,
  onChangeIdentity,
  onBack,
  onContinue,
  loading,
}: IdentityScreenProps) {
  const { colors } = useThemeContext();
  const canContinue = identityForm.gender !== "";

  const styles = StyleSheet.create({
    fieldBlock: {
      gap: moderateScale(8),
      marginBottom: verticalScale(18),
    },
    label: {
      paddingLeft: moderateScale(16),
      fontSize: moderateScale(14),
      fontWeight: "800",
      color: colors.foreground,
    },
    required: {
      color: colors.primary,
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
      <ProgressSteps activeStep={2} totalSteps={4} />
      <SectionHeader
        title="Your identity"
        subtitle="Help us understand you better — most of this is optional"
      />

      {/* ── Gender (required) ──────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          How do you describe yourself? <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.chipGrid}>
          {genders.map((g) => {
            const selected = identityForm.gender === g.id;
            return (
              <Pressable
                key={g.id}
                onPress={() => onChangeIdentity({ ...identityForm, gender: g.id as GenderOption })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Orientation (optional) ─────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>What's your sexual orientation? <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {orientations.map((o) => {
            const selected = identityForm.orientation === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => onChangeIdentity({ ...identityForm, orientation: o.id as OrientationOption })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Religion (optional) ────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>What's your religion? <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {religions.map((r) => {
            const selected = identityForm.religion === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => onChangeIdentity({ ...identityForm, religion: r.id as ReligionOption })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Religion openness (optional) ───────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>How important is religion to you? <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.chipGrid}>
          {religionOpenness.map((ro) => {
            const selected = identityForm.religionOpenness === ro.id;
            return (
              <Pressable
                key={ro.id}
                onPress={() => onChangeIdentity({ ...identityForm, religionOpenness: ro.id as ReligionOpennessOption })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{ro.label}</Text>
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
