import { useState, useMemo, useCallback, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  LayoutChangeEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { sessionQuestions } from "../constants/sessionData";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import type { SessionProfile, SessionQuestion } from "../types/home";

type SessionProfileWidgetProps = {
  profile: SessionProfile;
  onChange: (profile: SessionProfile) => void;
};

// ── Custom Slider ──────────────────────────────────────────────────

type SliderQuestionProps = {
  value: number;
  onValueChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
};

function SliderQuestion({
  value = 0.5,
  onValueChange,
  minLabel,
  maxLabel,
}: SliderQuestionProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const { colors } = useThemeContext();
  const thumbSize = moderateScale(22);

  const handleInteract = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const v = Math.max(0, Math.min(1, x / trackWidth));
      onValueChange(Math.round(v * 100) / 100);
    },
    [trackWidth, onValueChange]
  );

  const thumbLeft = trackWidth > 0 ? trackWidth * value - thumbSize / 2 : 0;
  const fillWidth = trackWidth > 0 ? trackWidth * value : 0;

  const sliderStyles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
    },
    endLabel: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.mutedForeground,
      width: moderateScale(52),
    },
    track: {
      flex: 1,
      height: moderateScale(8),
      borderRadius: moderateScale(4),
      backgroundColor: colors.muted,
      position: "relative",
      overflow: "hidden",
    },
    fill: {
      position: "absolute",
      top: 0,
      left: 0,
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: moderateScale(4),
    },
    thumb: {
      position: "absolute",
      top: (moderateScale(8) - moderateScale(22)) / 2,
      width: moderateScale(22),
      height: moderateScale(22),
      borderRadius: moderateScale(11),
      backgroundColor: colors.white,
      borderWidth: 3,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
  });

  return (
    <View style={sliderStyles.row}>
      <Text style={sliderStyles.endLabel}>{minLabel}</Text>
      <View
        style={sliderStyles.track}
        onLayout={(e: LayoutChangeEvent) =>
          setTrackWidth(e.nativeEvent.layout.width)
        }
        onTouchStart={(e) => handleInteract(e.nativeEvent.locationX)}
        onTouchMove={(e) => handleInteract(e.nativeEvent.locationX)}
      >
        <View style={[sliderStyles.fill, { width: fillWidth }]} />
        <View style={[sliderStyles.thumb, { left: thumbLeft }]} />
      </View>
      <Text style={sliderStyles.endLabel}>{maxLabel}</Text>
    </View>
  );
}

// ── Main Widget ────────────────────────────────────────────────────

export function SessionProfileWidget({
  profile,
  onChange,
}: SessionProfileWidgetProps) {
  const [randomSeed, setRandomSeed] = useState(0);
  const shuffleCount = useRef(0);
  const { colors } = useThemeContext();

  // Always show Mood + 2 random questions (one select, one other)
  const visibleQuestions = useMemo(() => {
    const mood = sessionQuestions.find((q) => q.id === "mood")!;
    const others = sessionQuestions.filter((q) => q.id !== "mood");

    // Seeded shuffle using shuffleCount
    const seed = randomSeed;
    const seeded = others.map((q, i) => ({
      q,
      sort: Math.sin(seed * 100 + i * 37) * 10000,
    }));
    seeded.sort((a, b) => a.sort - b.sort);

    const picks: SessionQuestion[] = [mood];

    // Pick one single-select
    const selects = seeded.filter((s) => s.q.type === "single-select");
    if (selects.length > 0) picks.push(selects[0].q);

    // Pick one non-single-select (slider or multi-select)
    const nonSelects = seeded.filter(
      (s) => s.q.type !== "single-select" && !picks.find((p) => p.id === s.q.id)
    );
    if (nonSelects.length > 0) picks.push(nonSelects[0].q);
    else if (selects.length > 1) picks.push(selects[1].q);

    return picks;
  }, [randomSeed]);

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shuffleCount.current += 1;
    setRandomSeed(shuffleCount.current);
  };

  const handleSingleSelect = (questionId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...profile, [questionId]: value });
  };

  const handleMultiSelect = (questionId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current =
      (profile[questionId as keyof SessionProfile] as string[] | undefined) ||
      [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...profile, [questionId]: updated });
  };

  const handleSlider = (questionId: string, value: number) => {
    onChange({ ...profile, [questionId]: value });
  };

  const handleOwnWords = (text: string) => {
    onChange({ ...profile, ownWords: text });
  };

  const styles = StyleSheet.create({
    container: {
      borderRadius: moderateScale(20),
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      padding: moderateScale(16),
      marginBottom: verticalScale(16),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: moderateScale(14),
    },
    title: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.foreground,
    },
    shuffleBtn: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: moderateScale(18),
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    questionBlock: {
      marginBottom: moderateScale(14),
    },
    questionLabel: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: moderateScale(8),
    },
    mandatory: {
      color: colors.primary,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
    },
    chip: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(8),
      borderRadius: 999,
      backgroundColor: colors.muted,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    chipText: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.foreground,
    },
    chipTextSelected: {
      color: colors.white,
    },
    ownWordsBlock: {
      marginTop: moderateScale(4),
      paddingTop: moderateScale(12),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    ownWordsLabel: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: moderateScale(8),
    },
    ownWordsInput: {
      backgroundColor: colors.muted,
      borderRadius: moderateScale(14),
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(10),
      fontSize: moderateScale(13),
      fontWeight: "600",
      color: colors.foreground,
      minHeight: moderateScale(60),
      textAlignVertical: "top",
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Check-in</Text>
        <Pressable onPress={handleShuffle} style={styles.shuffleBtn}>
          <Feather
            name="shuffle"
            size={moderateScale(18)}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* Questions */}
      {visibleQuestions.map((question) => (
        <View key={question.id} style={styles.questionBlock}>
          <Text style={styles.questionLabel}>
            {question.label}
            {question.mandatory && <Text style={styles.mandatory}> *</Text>}
          </Text>

          {/* Single Select */}
          {question.type === "single-select" && (
            <View style={styles.chipRow}>
              {question.options!.map((option) => {
                const selected =
                  (profile[question.id as keyof SessionProfile] as string) ===
                  option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => handleSingleSelect(question.id, option)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[styles.chipText, selected && styles.chipTextSelected]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Multi-select chips */}
          {question.type === "multi-select" && (
            <View style={styles.chipRow}>
              {question.options!.map((option) => {
                const current =
                  (profile[
                    question.id as keyof SessionProfile
                  ] as string[] | undefined) || [];
                const selected = current.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => handleMultiSelect(question.id, option)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[styles.chipText, selected && styles.chipTextSelected]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Slider */}
          {question.type === "slider" && (
            <SliderQuestion
              value={
                (profile[question.id as keyof SessionProfile] as number) ?? 0.5
              }
              onValueChange={(v) => handleSlider(question.id, v)}
              minLabel={question.sliderMin!}
              maxLabel={question.sliderMax!}
            />
          )}
        </View>
      ))}

      {/* Free-text: In your own words */}
      <View style={styles.ownWordsBlock}>
        <Text style={styles.ownWordsLabel}>In your own words...</Text>
        <TextInput
          style={styles.ownWordsInput}
          placeholder="How are you really feeling?"
          placeholderTextColor={colors.mutedForeground}
          value={profile.ownWords || ""}
          onChangeText={handleOwnWords}
          multiline
          maxLength={200}
          numberOfLines={2}
        />
      </View>
    </View>
  );
}
