import { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { startOfWeek, addDays, format } from "date-fns";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DNALoader } from "../components/DNALoader";
import { MatchAnimation } from "../components/MatchAnimation";
import { SessionProfileWidget } from "../components/SessionProfileWidget";
import { ShakeWidget } from "../components/ShakeWidget";
import { WeeklyAvailabilityStrip } from "../components/WeeklyAvailabilityStrip";
import { matchConnector } from "../connectors";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import { useCurrentDateTime } from "../hooks/useCurrentDateTime";
import { useShakeDetection } from "../hooks/useShakeDetection";
import type {
  DayAvailability,
  MatchResult,
  SessionProfile,
  ShakeState,
  TimeSlot,
} from "../types/home";

type HomeScreenProps = {
  userId: string;
  userName: string;
  onMatchConnect?: (matchId: string, matchedUserId: string, matchedUserName: string) => void;
};

/** Build current week Mon-Sun with empty time slots. */
function buildCurrentWeek(): DayAvailability[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayLabel: format(date, "EEE"),
      dateNumber: date.getDate(),
      isAvailable: false,
      timeSlots: [] as TimeSlot[],
    };
  });
}

export function HomeScreen({ userId, userName, onMatchConnect }: HomeScreenProps) {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile>({});
  const [shakeState, setShakeState] = useState<ShakeState>("idle");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] =
    useState<DayAvailability[]>(buildCurrentWeek);

  const { formattedDate, formattedTime } = useCurrentDateTime();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();

  // ── Update day time slots ────────────────────────────────────────
  const handleUpdateDay = (date: string, slots: TimeSlot[]) => {
    setWeeklyAvailability((prev) =>
      prev.map((d) =>
        d.date === date
          ? { ...d, timeSlots: slots, isAvailable: slots.length > 0 }
          : d
      )
    );
  };

  // ── Shake / Match ────────────────────────────────────────────────
  const handleShake = async () => {
    if (shakeState !== "idle") return;

    setShakeState("dna-loading");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useShakeDetection({
    onShake: handleShake,
    threshold: 1.5,
    cooldownMs: 3000,
  });

  // ── Check for pending match notifications on mount ──────────────
  useEffect(() => {
    (async () => {
      try {
        const pending = await matchConnector.getPendingMatches(userId);
        if (pending.length > 0) {
          // Vibrate to alert the user they've been matched
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        // Silently ignore
      }
    })();
  }, [userId]);

  const handleShakeAgain = () => {
    setShakeState("idle");
    setMatchResult(null);
  };

  const handleConnect = () => {
    if (matchResult?.matched && matchResult.matchId) {
      matchConnector.connectMatch(matchResult.matchId, userId);
      if (onMatchConnect && matchResult.matchedUserId && matchResult.matchedUserName) {
        onMatchConnect(matchResult.matchId, matchResult.matchedUserId, matchResult.matchedUserName);
      }
    }
    handleShakeAgain();
  };

  // ── Available days summary ───────────────────────────────────────
  const availableCount = weeklyAvailability.filter(
    (d) => d.timeSlots.length > 0
  ).length;

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: moderateScale(20),
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(32),
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: verticalScale(16),
    },
    greeting: {
      flex: 1,
    },
    greetingText: {
      fontSize: moderateScale(26),
      fontWeight: "900",
      color: colors.foreground,
    },
    dateTime: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: colors.mutedForeground,
      marginTop: moderateScale(4),
    },
    weekSummary: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.primary,
      marginTop: moderateScale(4),
    },
  });

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + verticalScale(16) }]}
      >
        {/* Header row: Greeting left + Shake Widget right */}
        <View style={styles.headerRow}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Hey, {userName}! 👋</Text>
            <Text style={styles.dateTime}>
              {formattedDate} · {formattedTime}
            </Text>
            <Text style={styles.weekSummary}>
              {availableCount}/7 days with time slots
            </Text>
          </View>

          {/* Shake Widget — small bouncing circle at top-right */}
          <ShakeWidget
            onPress={handleShake}
            isShaking={shakeState === "shaking"}
          />
        </View>

        {/* Weekly Availability Strip */}
        <WeeklyAvailabilityStrip
          availability={weeklyAvailability}
          onUpdateDay={handleUpdateDay}
        />

        {/* Session Profile (replaces old mood + connection selectors) */}
        <SessionProfileWidget
          profile={sessionProfile}
          onChange={setSessionProfile}
        />
      </ScrollView>

      {/* DNA Loader Overlay */}
      {shakeState === "dna-loading" && (
        <DNALoader
          userId={userId}
          sessionProfile={sessionProfile}
          availability={weeklyAvailability}
          onComplete={(result) => {
            setMatchResult(result);
            setShakeState("matched");
          }}
          onError={(message) => {
            setMatchResult({ matched: false, message });
            setShakeState("matched");
          }}
        />
      )}

      {/* Match Animation Overlay */}
      {shakeState === "matched" && matchResult && (
        <MatchAnimation
          match={matchResult}
          onShakeAgain={handleShakeAgain}
          onConnect={handleConnect}
        />
      )}
    </View>
  );
}
