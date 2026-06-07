import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { AppButton } from "./AppButton";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import type { MatchResult, OverlappingSlot } from "../types/home";

type MatchAnimationProps = {
  match: MatchResult;
  onShakeAgain: () => void;
  onConnect: () => void;
};

/** Format an overlapping slot for display */
function formatOverlap(slot: OverlappingSlot): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(slot.date + "T12:00:00");
  const dayName = days[d.getDay()];
  const startH = slot.startHour === 0 ? 12 : slot.startHour > 12 ? slot.startHour - 12 : slot.startHour;
  const ampm = slot.startHour < 12 ? "AM" : "PM";
  const minStr = slot.startMinute === 0 ? "" : `:${slot.startMinute}`;
  const endTotal = slot.startHour * 60 + slot.startMinute + slot.durationHours * 60;
  const endH24 = Math.floor(endTotal / 60) % 24;
  const endH = endH24 === 0 ? 12 : endH24 > 12 ? endH24 - 12 : endH24;
  const endAmpm = endH24 < 12 ? "AM" : "PM";
  return `${dayName} ${startH}${minStr}${ampm}–${endH}${endAmpm}`;
}

export function MatchAnimation({ match, onShakeAgain, onConnect }: MatchAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const percentAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useThemeContext();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();

    // Animate percentage counting up
    if (match.matchPercentage) {
      Animated.timing(percentAnim, {
        toValue: match.matchPercentage,
        duration: 1200,
        useNativeDriver: false,
        easing: Easing.out(Easing.quad),
      }).start();
    }
  }, []);

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
    },
    gradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
      gap: moderateScale(14),
      paddingHorizontal: moderateScale(32),
    },
    iconBubble: {
      width: moderateScale(90),
      height: moderateScale(90),
      borderRadius: moderateScale(45),
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    percentCircle: {
      width: moderateScale(110),
      height: moderateScale(110),
      borderRadius: moderateScale(55),
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    percentText: {
      fontSize: moderateScale(36),
      fontWeight: "900",
      color: colors.white,
      lineHeight: moderateScale(40),
    },
    percentSymbol: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase",
    },
    catchPhrase: {
      fontSize: moderateScale(20),
      fontWeight: "800",
      color: colors.white,
      textAlign: "center",
    },
    title: {
      fontSize: moderateScale(26),
      fontWeight: "900",
      color: colors.white,
      textAlign: "center",
    },
    subtitle: {
      fontSize: moderateScale(15),
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
    },
    matchedName: {
      fontSize: moderateScale(17),
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
    },
    shared: {
      fontSize: moderateScale(13),
      color: "rgba(255,255,255,0.75)",
      textAlign: "center",
    },
    overlapSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(8),
      borderRadius: 999,
    },
    overlapText: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
    },
    actions: {
      flexDirection: "row",
      gap: moderateScale(12),
      marginTop: verticalScale(12),
    },
    actionButton: {
      minWidth: moderateScale(130),
    },
    singleButton: {
      minWidth: moderateScale(180),
      marginTop: verticalScale(8),
    },
  });

  // No match case
  if (!match.matched) {
    return (
      <View style={styles.overlay}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconBubble}>
              <Feather name="search" size={moderateScale(48)} color={colors.mutedForeground} />
            </View>
            <Text style={styles.title}>No match this time</Text>
            <Text style={styles.subtitle}>{match.message || "Shake again later!"}</Text>
            <AppButton title="Try Again" onPress={onShakeAgain} variant="white" style={styles.singleButton} />
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Match found!
  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          {/* Percentage circle */}
          {match.matchPercentage != null && (
            <View style={styles.percentCircle}>
              <Animated.Text style={styles.percentText}>
                {Math.round(match.matchPercentage)}
              </Animated.Text>
              <Text style={styles.percentSymbol}>%match</Text>
            </View>
          )}

          {/* Catch phrase */}
          {match.catchPhrase && (
            <Text style={styles.catchPhrase}>{match.catchPhrase}</Text>
          )}

          {/* Matched name */}
          {match.matchedUserName && (
            <Text style={styles.matchedName}>Matched with {match.matchedUserName}</Text>
          )}

          {/* Shared interests */}
          {match.sharedInterests && match.sharedInterests.length > 0 && (
            <Text style={styles.shared}>
              Shared: {match.sharedInterests.join(", ")}
            </Text>
          )}

          {/* Overlapping time */}
          {match.overlappingSlots && match.overlappingSlots.length > 0 && (
            <View style={styles.overlapSection}>
              <Feather name="clock" size={moderateScale(14)} color="rgba(255,255,255,0.8)" />
              <Text style={styles.overlapText}>
                Both free: {formatOverlap(match.overlappingSlots[0])}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <AppButton title="Shake Again" onPress={onShakeAgain} variant="secondary" style={styles.actionButton} />
            <AppButton title="Connect" onPress={onConnect} variant="white" style={styles.actionButton} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
