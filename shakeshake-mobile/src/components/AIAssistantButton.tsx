import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale } from "../constants/theme";

type AIAssistantButtonProps = {
  onPress: () => void;
};

export function AIAssistantButton({ onPress }: AIAssistantButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.6)).current;
  const { colors } = useThemeContext();

  // Bounce loop
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Glow pulse
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const styles = StyleSheet.create({
    button: {
      width: moderateScale(44),
      height: moderateScale(44),
      borderRadius: moderateScale(22),
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.3)",
    },
    emoji: {
      fontSize: moderateScale(20),
    },
  });

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: glow }}>
      <Pressable onPress={handlePress} style={styles.button}>
        <Text style={styles.emoji}>🐉</Text>
      </Pressable>
    </Animated.View>
  );
}
