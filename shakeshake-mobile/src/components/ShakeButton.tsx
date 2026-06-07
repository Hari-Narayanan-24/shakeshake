import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";

type ShakeButtonProps = {
  onPress: () => void;
  isShaking: boolean;
};

export function ShakeButton({ onPress, isShaking }: ShakeButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const { colors } = useThemeContext();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      gap: moderateScale(12),
      marginTop: verticalScale(8),
      marginBottom: verticalScale(24),
    },
    button: {
      width: moderateScale(140),
      height: moderateScale(140),
      borderRadius: moderateScale(70),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      gap: moderateScale(8),
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    buttonShaking: {
      backgroundColor: colors.foreground,
      shadowColor: colors.foreground,
    },
    buttonPressed: {
      transform: [{ scale: 0.95 }],
    },
    iconShaking: {
      transform: [{ rotate: "15deg" }],
    },
    text: {
      fontSize: moderateScale(18),
      fontWeight: "800",
      color: colors.white,
    },
    hint: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: isShaking ? 1 : pulse }] }}>
        <Pressable
          onPress={handlePress}
          disabled={isShaking}
          style={({ pressed }) => [
            styles.button,
            isShaking && styles.buttonShaking,
            pressed && styles.buttonPressed,
          ]}
        >
          <Feather
            name="smartphone"
            size={moderateScale(32)}
            color={colors.white}
            style={isShaking ? styles.iconShaking : undefined}
          />
          <Text style={styles.text}>
            {isShaking ? "Matching..." : "Shake It!"}
          </Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.hint}>
        Shake your phone or tap the button
      </Text>
    </View>
  );
}
