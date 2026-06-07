import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale } from "../constants/theme";

type ShakeWidgetProps = {
  onPress: () => void;
  isShaking: boolean;
};

/** Small bouncing widget that floats within a confined area at the top-right. */
export function ShakeWidget({ onPress, isShaking }: ShakeWidgetProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const { colors } = useThemeContext();

  const BOUNCE = moderateScale(12);
  const CIRCLE_SIZE = moderateScale(56);

  // ── Floating bounce inside bounded area ─────────────────────────
  useEffect(() => {
    if (isShaking) return;

    const xLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: BOUNCE,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(translateX, {
          toValue: -BOUNCE,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    const yLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -BOUNCE,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(translateY, {
          toValue: BOUNCE,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    Animated.parallel([xLoop, yLoop]).start();
    return () => {
      xLoop.stop();
      yLoop.stop();
    };
  }, [isShaking, BOUNCE, translateX, translateY]);

  // ── Subtle pulse ────────────────────────────────────────────────
  useEffect(() => {
    if (isShaking) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isShaking, pulse]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  const styles = StyleSheet.create({
    boundedArea: {
      // The confined bounding box — widget bounces inside this
      width: CIRCLE_SIZE + moderateScale(32),
      height: CIRCLE_SIZE + moderateScale(32),
      alignItems: "center",
      justifyContent: "center",
    },
    circle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      gap: moderateScale(2),
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    circleShaking: {
      backgroundColor: colors.foreground,
      shadowColor: colors.foreground,
      shadowOpacity: 0.3,
    },
    circlePressed: {
      transform: [{ scale: 0.92 }],
    },
    label: {
      fontSize: moderateScale(10),
      fontWeight: "800",
      color: colors.white,
      marginTop: -moderateScale(2),
    },
  });

  return (
    <View style={styles.boundedArea} pointerEvents="box-none">
      <Animated.View
        style={{
          transform: [
            { translateX },
            { translateY },
            { scale: isShaking ? 1 : pulse },
          ],
        }}
      >
        <Pressable
          onPress={handlePress}
          disabled={isShaking}
          style={({ pressed }) => [
            styles.circle,
            isShaking && styles.circleShaking,
            pressed && styles.circlePressed,
          ]}
        >
          <Feather
            name="smartphone"
            size={moderateScale(22)}
            color={colors.white}
          />
          <Text style={styles.label}>
            {isShaking ? "..." : "Shake"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
