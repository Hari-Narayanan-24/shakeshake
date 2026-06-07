import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

// Neon disco colors
const DISCO = [
  "rgba(255,0,128,0.55)",   // hot magenta
  "rgba(0,255,255,0.50)",   // cyan
  "rgba(255,255,0,0.45)",   // neon yellow
  "rgba(0,255,128,0.50)",   // neon lime
  "rgba(180,0,255,0.50)",   // electric purple
  "rgba(255,100,0,0.45)",   // hot orange
];

export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();

  // ── Heartbeat (lub-dub) ──────────────────────────────────────
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // lub-dub rhythm: two quick beats then a rest
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.22, duration: 130, useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(heartScale, {
          toValue: 1.0, duration: 90, useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(heartScale, {
          toValue: 1.12, duration: 100, useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(heartScale, {
          toValue: 1.0, duration: 130, useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.delay(400),
      ])
    );
    anim.start();
    return () => { anim.stop(); heartScale.setValue(1); };
  }, []);

  // ── Disco strobe rings ───────────────────────────────────────
  // Each ring gets its own Animated.Value that pulses 0→1→0
  // staggered so they flash one after another
  const discoValues = useRef<Animated.Value[]>(
    DISCO.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const STAGGER = 400; // ms between each ring's flash
    const FLASH_UP = 280;
    const FLASH_DOWN = 280;
    const CYCLE = STAGGER * DISCO.length; // time for full rotation

    const loops = discoValues.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          // wait for this ring's turn
          Animated.delay(STAGGER * i),
          // flash on
          Animated.timing(val, {
            toValue: 1, duration: FLASH_UP, useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          // flash off
          Animated.timing(val, {
            toValue: 0, duration: FLASH_DOWN, useNativeDriver: true,
            easing: Easing.in(Easing.quad),
          }),
          // wait out the rest of the cycle
          Animated.delay(
            Math.max(0, CYCLE - STAGGER * i - FLASH_UP - FLASH_DOWN)
          ),
        ])
      )
    );

    Animated.parallel(loops).start();
    return () => loops.forEach((l) => l.stop());
  }, []);

  // ── Text pulse (derived from heartbeat) ──────────────────────
  const textScale = heartScale.interpolate({
    inputRange: [1, 1.22],
    outputRange: [1, 1.06],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
    },
    content: {
      flex: 1,
      width: "100%",
      maxWidth: 500,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      gap: verticalScale(28),
    },

    heartWrapper: {
      alignItems: "center",
      justifyContent: "center",
    },
    discoRing: {
      position: "absolute",
      width: moderateScale(200),
      height: moderateScale(200),
      borderRadius: moderateScale(100),
    },
    glowCircle: {
      width: moderateScale(126),
      height: moderateScale(126),
      borderRadius: moderateScale(63),
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#FF1744",
      shadowOpacity: 0.55,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 10 },
      elevation: 14,
    },
    shineOverlay: {
      position: "absolute",
      top: moderateScale(8),
      left: moderateScale(20),
      width: moderateScale(50),
      height: moderateScale(30),
      borderRadius: moderateScale(25),
      backgroundColor: "rgba(255,255,255,0.35)",
      transform: [{ rotate: "-20deg" }],
    },

    logo: {
      fontSize: moderateScale(56),
      lineHeight: moderateScale(64),
      fontWeight: "900",
      color: colors.white,
      letterSpacing: -1.5,
      textAlign: "center",
      textShadowColor: "rgba(0,0,0,0.18)",
      textShadowOffset: { width: 2, height: 3 },
      textShadowRadius: 6,
    },
    tagline: {
      fontSize: moderateScale(18),
      fontWeight: "600",
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
    },

    actions: {
      width: "100%",
      gap: verticalScale(12),
      marginTop: verticalScale(16),
    },
    whiteButton: {
      backgroundColor: colors.white,
    },
    terms: {
      fontSize: moderateScale(13),
      color: "rgba(255,255,255,0.75)",
      textAlign: "center",
      lineHeight: moderateScale(20),
    },
  });

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + verticalScale(24),
            paddingBottom: insets.bottom + verticalScale(24),
            paddingLeft: insets.left || moderateScale(24),
            paddingRight: insets.right || moderateScale(24),
          },
        ]}
      >
        {/* ── Heart + disco glow ────────────────────────────── */}
        <View style={styles.heartWrapper}>
          {DISCO.map((color, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.discoRing,
                {
                  backgroundColor: color,
                  opacity: discoValues[i],
                  transform: [{
                    scale: heartScale.interpolate({
                      inputRange: [1, 1.22],
                      outputRange: [1, 1.3 + i * 0.04],
                    }),
                  }],
                },
              ]}
            />
          ))}

          <Animated.View
            style={[styles.glowCircle, { transform: [{ scale: heartScale }] }]}
          >
            <View style={styles.shineOverlay} />
            <Feather
              name="heart"
              size={moderateScale(92)}
              color={colors.white}
              strokeWidth={2.5}
            />
          </Animated.View>
        </View>

        {/* ── Logo pulses with heartbeat ────────────────────── */}
        <Animated.View style={{ transform: [{ scale: textScale }] }}>
          <Text style={styles.logo}>shakeshake</Text>
        </Animated.View>

        <Text style={styles.tagline}>Find your vibe, meet your people</Text>

        {/* ── Buttons ───────────────────────────────────────── */}
        <View style={styles.actions}>
          <AppButton
            title="Get Started"
            onPress={onGetStarted}
            variant="white"
            style={styles.whiteButton}
          />
          <AppButton title="Sign In" onPress={onSignIn} variant="secondary" />
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms &amp; Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
}
