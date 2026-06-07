import { useEffect, useRef, useState, useMemo } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import { matchConnector } from "../connectors";
import type { DayAvailability, MatchResult, SessionProfile } from "../types/home";

// ── Types ───────────────────────────────────────────────────────────

type DNALoaderProps = {
  userId: string;
  sessionProfile: SessionProfile;
  availability: DayAvailability[];
  onComplete: (result: MatchResult) => void;
  onError: (message: string) => void;
};

// ── Constants ───────────────────────────────────────────────────────

const TOTAL_DURATION_MS = 20_000;
const PHRASE_INTERVAL_MS = 4_000;
const STEP_INTERVAL_MS = TOTAL_DURATION_MS / 4; // each step activates at 5s

const PHRASES = [
  "Our LLM is genuinely thinking to map you...",
  "We're finding you a perfect match for the moment...",
  "Analyzing emotional wavelengths...",
  "Mapping your vibe DNA...",
  "Decoding your emotional signature...",
];

const STEPS = [
  "Reading profiles...",
  "Comparing emotions...",
  "Finding common ground...",
  "Generating match...",
];

// ── DNA Geometry (scaled for responsive) ───────────────────────────

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const NUM_DOTS_PER_STRAND = 28;
const DOT_SPACING = moderateScale(32);
const HELIX_AMPLITUDE = moderateScale(50);
const DOT_SIZE = moderateScale(7);
const RUNG_INTERVAL = 3;
const NUM_SPARKLES = 15; // increased from 7 for richer effect

const CENTER_X = SCREEN_WIDTH / 2;

// ── Pre-compute helix dot positions ────────────────────────────────

const TOTAL_HELIX_HEIGHT = NUM_DOTS_PER_STRAND * DOT_SPACING;
const HELIX_HEIGHT = TOTAL_HELIX_HEIGHT + DOT_SPACING * 4;

const HELIX_DOTS: { x: number; y: number; key: string; rung: boolean; colorIdx: number }[] = [];
for (let i = 0; i < NUM_DOTS_PER_STRAND + 4; i++) {
  const y = i * DOT_SPACING;
  const phase = (i * Math.PI) / 5;
  const sinVal = Math.sin(phase);

  HELIX_DOTS.push({
    x: CENTER_X + sinVal * HELIX_AMPLITUDE,
    y,
    key: `s1-${i}`,
    rung: i % RUNG_INTERVAL === 0 && i > 0 && i < NUM_DOTS_PER_STRAND + 3,
    colorIdx: i % 2,
  });
  HELIX_DOTS.push({
    x: CENTER_X - sinVal * HELIX_AMPLITUDE,
    y,
    key: `s2-${i}`,
    rung: false,
    colorIdx: i % 2,
  });
}

// ── Sparkle seed data ──────────────────────────────────────────────

const SPARKLE_SEEDS = Array.from({ length: NUM_SPARKLES }, (_, i) => ({
  offsetX: (Math.sin(i * 73.7 + 12.3) * 0.5 + 0.5) * 140 - 70, // wider spread
  offsetY: (Math.cos(i * 47.1 + 8.9) * 0.5 + 0.5) * 240 - 120,
  duration: 1000 + (i * 137 % 700),
  delay: i * 200, // faster stagger
  size: moderateScale(3 + (i % 4)),
}));

// ── Helper: derive DNA colors from theme ──────────────────────────

function getDNAColors(theme: {
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  white: string;
}) {
  return {
    gradStart: theme.primary,
    gradMid: theme.primaryLight,
    gradEnd: theme.secondary,
    dotWhite: theme.white,
    dotPink: theme.accent,
    rungLine: `${theme.white}50`,
    textWhite: theme.white,
    checkGreen: "#00FF88",
    glowColor: `${theme.primary}40`,
    sparkleColor: theme.accent,
  };
}

// ── Component ──────────────────────────────────────────────────────

export function DNALoader({
  userId,
  sessionProfile,
  availability,
  onComplete,
  onError,
}: DNALoaderProps) {
  const { colors, theme } = useThemeContext();
  const dnaColors = useMemo(() => getDNAColors(theme), [theme]);

  // ── Scroll animation ─────────────────────────────────────────────
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // ── Phrase cycling ───────────────────────────────────────────────
  const phraseOpacity = useRef(new Animated.Value(1)).current;
  const [phraseIndex, setPhraseIndex] = useState(0);

  // ── Step progress ────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0);
  const stepCheckOpacities = STEPS.map(() => useRef(new Animated.Value(0)).current);
  const stepSlideAnims = STEPS.map(() => useRef(new Animated.Value(30)).current);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // ── Percentage counter ───────────────────────────────────────────
  const [displayPercent, setDisplayPercent] = useState(0);

  // ── Pulsing glow ring ────────────────────────────────────────────
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  // ── Sparkle animations ──────────────────────────────────────────
  const sparkleAnims = useMemo(
    () =>
      Array.from({ length: NUM_SPARKLES }, () => ({
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
      })),
    []
  );

  // ── API result storage ───────────────────────────────────────────
  const matchResultRef = useRef<MatchResult | null>(null);
  const apiDoneRef = useRef(false);

  // ── Start continuous helix scroll (smoother easing, faster) ───────
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 4500, // faster cycle (was 6000)
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin), // smoother (was linear)
      })
    );
    animation.start();
    return () => animation.stop();
  }, [scrollAnim]);

  // ── Pulsing glow ring ─────────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(glowScale, {
            toValue: 0.85,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [glowScale, glowOpacity]);

  // ── Sparkle loop ──────────────────────────────────────────────────
  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];
    sparkleAnims.forEach((anim, i) => {
      const seed = SPARKLE_SEEDS[i];
      const sequence = Animated.sequence([
        Animated.delay(seed.delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: seed.duration * 0.4,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: seed.duration * 0.4,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: seed.duration * 0.6,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
          Animated.timing(anim.scale, {
            toValue: 0,
            duration: seed.duration * 0.6,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ]),
      ]);
      const loop = Animated.loop(sequence);
      loop.start();
      loops.push(loop);
    });
    return () => loops.forEach((l) => l.stop());
  }, [sparkleAnims]);

  // ── Phrase cycling with fade ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(phraseOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        Animated.timing(phraseOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phraseOpacity]);

  // ── Step progress + percentage tracking ──────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const step = Math.min(
        Math.floor(elapsed / STEP_INTERVAL_MS),
        STEPS.length - 1
      );
      setActiveStep(step);

      const pct = Math.min(Math.floor((elapsed / TOTAL_DURATION_MS) * 100), 100);
      setDisplayPercent(pct);
    }, 50);
    return () => clearInterval(tick);
  }, []);

  // ── Animate checkmarks & slide-in when step changes ───────────────
  useEffect(() => {
    stepCheckOpacities.forEach((opacity, idx) => {
      if (idx < activeStep) {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }
    });
    if (activeStep > 0 && activeStep <= STEPS.length) {
      Animated.timing(stepSlideAnims[activeStep - 1], {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
    Animated.timing(stepSlideAnims[activeStep], {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [activeStep, stepCheckOpacities, stepSlideAnims]);

  // ── Fire API call on mount ──────────────────────────────────────
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    matchConnector
      .findMatch({
        userId,
        sessionProfile,
        availability,
      })
      .then((response) => {
        matchResultRef.current = {
          matched: response.matched ?? false,
          matchId: response.matchId,
          matchedUserId: response.matchedUserId,
          matchedUserName: response.matchedUserName,
          matchPercentage: response.matchPercentage,
          message:
            response.message ??
            (response.matched ? "Vibe matched! 💥" : "No match this time"),
          sharedInterests: response.sharedInterests ?? [],
          catchPhrase: response.catchPhrase,
          overlappingSlots: response.overlappingSlots ?? [],
        };
        apiDoneRef.current = true;

        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= TOTAL_DURATION_MS) {
          completedRef.current = true;
          onComplete(matchResultRef.current);
        } else {
          const remaining = TOTAL_DURATION_MS - elapsed;
          timeout = setTimeout(() => {
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete(matchResultRef.current!);
            }
          }, remaining);
        }
      })
      .catch(() => {
        apiDoneRef.current = true;
        matchResultRef.current = { matched: false, message: "Match request failed" };

        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= TOTAL_DURATION_MS) {
          completedRef.current = true;
          onError("Something went wrong finding your match.");
        } else {
          const remaining = TOTAL_DURATION_MS - elapsed;
          timeout = setTimeout(() => {
            if (!completedRef.current) {
              completedRef.current = true;
              onError("Something went wrong finding your match.");
            }
          }, remaining);
        }
      });

    return () => clearTimeout(timeout);
  }, [userId, onComplete, onError]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={[dnaColors.gradStart, dnaColors.gradMid, dnaColors.gradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Pulsing Glow Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
              backgroundColor: dnaColors.glowColor,
            },
          ]}
        />

        {/* DNA Helix */}
        <View style={styles.helixContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.helixTrack,
              {
                transform: [
                  {
                    translateY: scrollAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -DOT_SPACING * RUNG_INTERVAL],
                    }),
                  },
                ],
              },
            ]}
          >
            {HELIX_DOTS.map((dot) => (
              <View key={dot.key}>
                {dot.rung && (
                  <Animated.View
                    style={[
                      styles.rung,
                      {
                        left: CENTER_X - HELIX_AMPLITUDE - DOT_SIZE,
                        top: dot.y - DOT_SIZE / 2,
                      },
                    ]}
                  >
                    <View style={[styles.rungLine, { backgroundColor: dnaColors.rungLine }]} />
                  </Animated.View>
                )}
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      left: dot.x - DOT_SIZE / 2,
                      top: dot.y - DOT_SIZE / 2,
                      opacity: scrollAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: dot.y > HELIX_HEIGHT - SCREEN_HEIGHT
                          ? [0, 1]
                          : dot.y < SCREEN_HEIGHT * 0.15
                          ? [1, 0.3]
                          : [1, 1],
                      }),
                      backgroundColor: dot.colorIdx === 0 ? dnaColors.dotWhite : dnaColors.dotPink,
                      shadowColor: dot.colorIdx === 0 ? dnaColors.dotWhite : dnaColors.dotPink,
                    },
                  ]}
                />
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Sparkle Effects */}
        <View style={styles.sparkleLayer} pointerEvents="none">
          {SPARKLE_SEEDS.map((seed, i) => (
            <Animated.View
              key={`sparkle-${i}`}
              style={[
                styles.sparkleDot,
                {
                  left: CENTER_X + seed.offsetX,
                  top: SCREEN_HEIGHT * 0.25 + seed.offsetY,
                  width: seed.size,
                  height: seed.size,
                  opacity: sparkleAnims[i].opacity,
                  transform: [{ scale: sparkleAnims[i].scale }],
                  backgroundColor: dnaColors.sparkleColor,
                  shadowColor: dnaColors.sparkleColor,
                },
              ]}
            />
          ))}
        </View>

        {/* Phrase */}
        <View style={styles.phraseContainer}>
          <Animated.Text
            style={[styles.phraseText, { opacity: phraseOpacity, color: dnaColors.textWhite }]}
            numberOfLines={2}
          >
            {PHRASES[phraseIndex]}
          </Animated.Text>
        </View>

        {/* Percentage Counter */}
        <Text style={[styles.percentText, { color: dnaColors.textWhite }]}>{displayPercent}%</Text>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((label, idx) => (
            <Animated.View
              key={label}
              style={[
                styles.stepRow,
                {
                  transform: [{ translateX: stepSlideAnims[idx] }],
                  opacity: stepSlideAnims[idx].interpolate({
                    inputRange: [0, 30],
                    outputRange: [1, 0],
                  }),
                },
              ]}
            >
              <View style={styles.stepIndicator}>
                <Animated.View
                  style={[styles.checkContainer, { opacity: stepCheckOpacities[idx] }]}
                >
                  <Feather
                    name="check-circle"
                    size={moderateScale(18)}
                    color={dnaColors.checkGreen}
                  />
                </Animated.View>
                <View
                  style={[
                    styles.pendingCircle,
                    idx < activeStep && styles.pendingCircleHidden,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  idx < activeStep && { color: dnaColors.textWhite },
                ]}
              >
                {label}
              </Text>
            </Animated.View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },

  // ── Pulsing Glow Ring ─────────────────────────────────────────────
  glowRing: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.15,
    left: CENTER_X - moderateScale(100),
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
  },

  helixContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  helixTrack: {
    position: "absolute",
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  rung: {
    position: "absolute",
    width: HELIX_AMPLITUDE * 2 + DOT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  rungLine: {
    width: "100%",
    height: 2,
    borderRadius: 1,
  },

  // ── Sparkle Effects ──────────────────────────────────────────────
  sparkleLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  sparkleDot: {
    position: "absolute",
    borderRadius: 999,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },

  // ── Phrase ────────────────────────────────────────────────────────
  phraseContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(40),
  },
  phraseText: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    textAlign: "center",
    lineHeight: moderateScale(26),
  },

  // ── Percentage Counter ────────────────────────────────────────────
  percentText: {
    fontSize: moderateScale(36),
    fontWeight: "900",
    letterSpacing: moderateScale(2),
    marginBottom: verticalScale(8),
  },

  // ── Steps ──────────────────────────────────────────────────────────
  stepsContainer: {
    paddingBottom: verticalScale(60),
    paddingHorizontal: moderateScale(28),
    gap: verticalScale(14),
    width: "100%",
    alignItems: "flex-start",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  stepIndicator: {
    width: moderateScale(20),
    height: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  checkContainer: {
    position: "absolute",
  },
  pendingCircle: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "transparent",
  },
  pendingCircleHidden: {
    opacity: 0,
  },
  stepLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});
