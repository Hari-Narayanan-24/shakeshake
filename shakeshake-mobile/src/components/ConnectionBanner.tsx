import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../contexts/ThemeContext";

type ConnectionBannerProps = {
  visible: boolean;
  onDismiss?: () => void;
};

export function ConnectionBanner({ visible, onDismiss }: ConnectionBannerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -60,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.primary,
          paddingTop: insets.top + 6,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Feather name="wifi-off" size={14} color={colors.white} />
        <Text style={[styles.text, { color: colors.white }]}>
          Offline Demo Mode
        </Text>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Feather name="x" size={14} color={colors.white} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
