import React, { useCallback, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
  Animated,
} from "react-native";

type AnimatedCardProps = PressableProps & {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Scale factor on press (default 0.96) */
  pressScale?: number;
};

export function AnimatedCard({
  children,
  style,
  pressScale = 0.96,
  ...pressableProps
}: AnimatedCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = useCallback(() => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      useNativeDriver: true,
      speed: 300,
      bounciness: 0,
    }).start();
    Animated.timing(opacityAnim, {
      toValue: 0.85,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [pressScale, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 300,
      bounciness: 10,
    }).start();
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.pressable, pressed && styles.pressedShadow, style]}
        {...pressableProps}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    // allows the animated view to shrink within parent layout
    alignSelf: "center",
  },
  pressable: {
    // base — no extra styling, inherit from parent
  },
  pressedShadow: {
    // shadow reduction happens via scale
  },
});
