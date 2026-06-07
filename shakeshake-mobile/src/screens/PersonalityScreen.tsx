import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";
import { AppButton } from "../components/AppButton";
import { ProgressSteps } from "../components/ProgressSteps";
import { ScreenShell } from "../components/ScreenShell";
import { SectionHeader } from "../components/SectionHeader";
import {
  mbtiOptions,
  personalityPhrases,
  sbtiOptions,
  MBTI_INFO,
  SBTI_INFO,
} from "../constants/onboardingData";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type { PersonalityTraitsForm } from "../types/onboarding";

type PersonalityScreenProps = {
  personalityForm: PersonalityTraitsForm;
  onChangePersonality: (data: PersonalityTraitsForm) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
};

export function PersonalityScreen({
  personalityForm,
  onChangePersonality,
  onBack,
  onContinue,
  loading,
}: PersonalityScreenProps) {
  const { colors } = useThemeContext();

  // Pick a catchy phrase — stable per mount
  const [phrase] = useState(
    () => personalityPhrases[Math.floor(Math.random() * personalityPhrases.length)]
  );

  const [mbtiOpen, setMbtiOpen] = useState(false);
  const [sbtiOpen, setSbtiOpen] = useState(false);

  const canContinue = personalityForm.mbti !== "";

  const showInfo = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "Got it!", style: "default" }]);
  };

  const styles = StyleSheet.create({
    fieldBlock: {
      gap: moderateScale(6),
      marginBottom: verticalScale(18),
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
      paddingLeft: moderateScale(16),
    },
    label: {
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

    // ── Dropdown ─────────────────────────────────────────────────
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: moderateScale(52),
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      paddingHorizontal: moderateScale(20),
    },
    dropdownText: {
      fontSize: moderateScale(15),
      fontWeight: "600",
      color: colors.foreground,
    },
    placeholder: {
      color: "#9CA3AF",
      fontWeight: "400",
    },
    dropdownList: {
      borderRadius: moderateScale(16),
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      marginTop: moderateScale(4),
      maxHeight: verticalScale(220),
      overflow: "hidden",
    },
    dropdownItem: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: moderateScale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemActive: {
      backgroundColor: colors.primary,
    },
    dropdownItemText: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: colors.foreground,
    },
    dropdownItemTextActive: {
      color: colors.white,
    },

    // ── Slider ───────────────────────────────────────────────────
    sliderLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: moderateScale(8),
    },
    sliderLabelLeft: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.foreground,
    },
    sliderLabelRight: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.mutedForeground,
    },
    slider: {
      width: "100%",
      height: moderateScale(40),
    },
    sliderValue: {
      textAlign: "center",
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.primary,
    },

    // ── Footer ───────────────────────────────────────────────────
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
      <ProgressSteps activeStep={4} totalSteps={4} />
      <SectionHeader
        title={phrase}
        subtitle="Help us understand your personality"
      />

      {/* ── MBTI Dropdown ─────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            What's your MBTI? <Text style={styles.required}>*</Text>
          </Text>
          <Pressable onPress={() => showInfo("What is MBTI?", MBTI_INFO)} hitSlop={8}>
            <Feather name="info" size={moderateScale(18)} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          style={styles.dropdown}
          onPress={() => { setMbtiOpen(!mbtiOpen); setSbtiOpen(false); }}
        >
          <Text style={[styles.dropdownText, !personalityForm.mbti && styles.placeholder]}>
            {personalityForm.mbti
              ? mbtiOptions.find((o) => o.id === personalityForm.mbti)?.label
              : "Select your MBTI type"}
          </Text>
          <Feather
            name={mbtiOpen ? "chevron-up" : "chevron-down"}
            size={moderateScale(20)}
            color={colors.mutedForeground}
          />
        </Pressable>

        {mbtiOpen && (
          <View style={styles.dropdownList}>
            {mbtiOptions.map((opt) => {
              const selected = personalityForm.mbti === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    onChangePersonality({ ...personalityForm, mbti: opt.id });
                    setMbtiOpen(false);
                  }}
                  style={[styles.dropdownItem, selected && styles.dropdownItemActive]}
                >
                  <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ── SBTI Dropdown ─────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>What's your SBTI type? <Text style={styles.optional}>(optional)</Text></Text>
          <Pressable onPress={() => showInfo("What is SBTI?", SBTI_INFO)} hitSlop={8}>
            <Feather name="info" size={moderateScale(18)} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable
          style={styles.dropdown}
          onPress={() => { setSbtiOpen(!sbtiOpen); setMbtiOpen(false); }}
        >
          <Text style={[styles.dropdownText, !personalityForm.sbti && styles.placeholder]}>
            {personalityForm.sbti
              ? sbtiOptions.find((o) => o.id === personalityForm.sbti)?.label
              : "Select your SBTI type"}
          </Text>
          <Feather
            name={sbtiOpen ? "chevron-up" : "chevron-down"}
            size={moderateScale(20)}
            color={colors.mutedForeground}
          />
        </Pressable>

        {sbtiOpen && (
          <View style={styles.dropdownList}>
            {sbtiOptions.map((opt) => {
              const selected = personalityForm.sbti === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    onChangePersonality({ ...personalityForm, sbti: opt.id });
                    setSbtiOpen(false);
                  }}
                  style={[styles.dropdownItem, selected && styles.dropdownItemActive]}
                >
                  <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Slider: Listener <-> Speaker ────────────────────────── */}
      <View style={styles.fieldBlock}>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelLeft}>Listener</Text>
          <Text style={styles.sliderLabelRight}>Speaker</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={personalityForm.listenerSpeaker}
          onValueChange={(v: number) =>
            onChangePersonality({ ...personalityForm, listenerSpeaker: Math.round(v * 100) / 100 })
          }
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.secondary}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.sliderValue}>{personalityForm.listenerSpeaker.toFixed(2)}</Text>
      </View>

      {/* ── Slider: Dominant <-> Passive ────────────────────────── */}
      <View style={styles.fieldBlock}>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelLeft}>Dominant</Text>
          <Text style={styles.sliderLabelRight}>Passive</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={personalityForm.dominantPassive}
          onValueChange={(v: number) =>
            onChangePersonality({ ...personalityForm, dominantPassive: Math.round(v * 100) / 100 })
          }
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.secondary}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.sliderValue}>{personalityForm.dominantPassive.toFixed(2)}</Text>
      </View>

      {/* ── Slider: Emotion <-> Action ──────────────────────────── */}
      <View style={styles.fieldBlock}>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelLeft}>Emotion</Text>
          <Text style={styles.sliderLabelRight}>Action</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={personalityForm.emotionAction}
          onValueChange={(v: number) =>
            onChangePersonality({ ...personalityForm, emotionAction: Math.round(v * 100) / 100 })
          }
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.secondary}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.sliderValue}>{personalityForm.emotionAction.toFixed(2)}</Text>
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
