import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  type ViewStyle,
} from "react-native";

type Direction = "up" | "down" | "left" | "right";

type FadeInViewProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Direction the content slides in from (default: "up") */
  direction?: Direction;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Animation duration in ms (default: 500) */
  duration?: number;
};

export function FadeInView({
  children,
  style,
  direction = "up",
  delay = 0,
  duration = 500,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(getInitialTranslate(direction))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translate, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
        delay,
      }),
    ]).start();
  }, [opacity, translate, duration, delay]);

  const translateStyle =
    direction === "up" || direction === "down"
      ? { translateY: translate }
      : { translateX: translate };

  return (
    <Animated.View
      style={[styles.container, translateStyle, { opacity }, style]}
    >
      {children}
    </Animated.View>
  );
}

function getInitialTranslate(direction: Direction): number {
  switch (direction) {
    case "up":
      return 20;
    case "down":
      return -20;
    case "left":
      return 20;
    case "right":
      return -20;
  }
}

const styles = StyleSheet.create({
  container: {
    // base container
  },
});
