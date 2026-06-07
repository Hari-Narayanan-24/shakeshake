import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { ProgressSteps } from "../components/ProgressSteps";
import { ScreenShell } from "../components/ScreenShell";
import { SectionHeader } from "../components/SectionHeader";
import { ageRanges, majors } from "../constants/onboardingData";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type { AgeRange, ProfileForm } from "../types/onboarding";

type ProfileScreenProps = {
  profileForm: ProfileForm;
  onChangeForm: (data: ProfileForm) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
};

export function ProfileScreen({
  profileForm,
  onChangeForm,
  onBack,
  onContinue,
  loading,
}: ProfileScreenProps) {
  const { colors } = useThemeContext();

  const isNameValid = profileForm.name.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email);
  const isPasswordValid = profileForm.password.length >= 6;
  const isAgeValid = profileForm.ageRange !== "";
  const isMajorValid = profileForm.major !== "";
  const isBioValid = profileForm.bio.length <= 50;
  const canContinue = isNameValid && isEmailValid && isPasswordValid && isAgeValid && isMajorValid && isBioValid;

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
      fontSize: moderateScale(12),
    },
    optional: {
      fontWeight: "600",
      color: colors.mutedForeground,
      fontSize: moderateScale(12),
    },
    input: {
      minHeight: moderateScale(52),
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      paddingHorizontal: moderateScale(20),
      fontSize: moderateScale(16),
      color: colors.foreground,
    },
    inputError: {
      borderColor: "#EF4444",
    },
    errorText: {
      paddingLeft: moderateScale(20),
      fontSize: moderateScale(12),
      color: "#EF4444",
      fontWeight: "600",
    },
    bioInput: {
      borderRadius: moderateScale(20),
      minHeight: moderateScale(72),
      paddingTop: moderateScale(14),
      paddingBottom: moderateScale(14),
      textAlignVertical: "top",
    },
    counter: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
      textAlign: "right",
      paddingRight: moderateScale(8),
    },
    counterWarn: {
      color: "#EF4444",
    },

    // ── Chips ────────────────────────────────────────────────────
    chipRow: {
      flexDirection: "row",
      gap: moderateScale(10),
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
      <ProgressSteps activeStep={1} totalSteps={4} />
      <SectionHeader
        title="Tell us about you"
        subtitle="Let's set up your profile — this only takes a minute"
      />

      {/* ── Name ──────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>What should we call you?</Text>
        <TextInput
          value={profileForm.name}
          onChangeText={(name) => onChangeForm({ ...profileForm, name })}
          placeholder="Your name or nickname"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="words"
          maxLength={50}
        />
      </View>

      {/* ── Email ─────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
        <TextInput
          value={profileForm.email}
          onChangeText={(email) => onChangeForm({ ...profileForm, email })}
          placeholder="alex@example.com"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, !isEmailValid && profileForm.email.length > 0 && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!isEmailValid && profileForm.email.length > 0 && (
          <Text style={styles.errorText}>Enter a valid email</Text>
        )}
      </View>

      {/* ── Password ──────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
        <TextInput
          value={profileForm.password}
          onChangeText={(password) => onChangeForm({ ...profileForm, password })}
          placeholder="At least 6 characters"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, !isPasswordValid && profileForm.password.length > 0 && styles.inputError]}
          secureTextEntry
        />
        {!isPasswordValid && profileForm.password.length > 0 && (
          <Text style={styles.errorText}>Minimum 6 characters</Text>
        )}
      </View>

      {/* ── Age range ─────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>How old are you?</Text>
        <View style={styles.chipRow}>
          {ageRanges.map((age) => {
            const selected = profileForm.ageRange === age.id;
            return (
              <Pressable
                key={age.id}
                onPress={() => onChangeForm({ ...profileForm, ageRange: age.id as AgeRange })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {age.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Major ─────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>What do you study or do?</Text>
        <View style={styles.chipGrid}>
          {majors.map((m) => {
            const selected = profileForm.major === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => onChangeForm({ ...profileForm, major: m.id })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Bio ───────────────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Tell us one line about you <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          value={profileForm.bio}
          onChangeText={(bio) => onChangeForm({ ...profileForm, bio })}
          placeholder="Something fun about you"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.bioInput]}
          maxLength={50}
          multiline
        />
        <Text style={[styles.counter, profileForm.bio.length > 45 && styles.counterWarn]}>
          {profileForm.bio.length}/50
        </Text>
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
