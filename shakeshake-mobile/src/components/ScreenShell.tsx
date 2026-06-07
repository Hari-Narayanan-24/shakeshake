import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../contexts/ThemeContext";
import { SPACING } from "../constants/theme";

type ScreenShellProps = {
  children: ReactNode;
};

export function ScreenShell({ children }: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();

  const styles = StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
    },
    inner: {
      flex: 1,
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
    },
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top || SPACING.screen,
          paddingBottom: insets.bottom || SPACING.screen,
          paddingLeft: insets.left || SPACING.screen,
          paddingRight: insets.right || SPACING.screen,
        },
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}
