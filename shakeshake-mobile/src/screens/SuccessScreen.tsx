import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

type SuccessScreenProps = {
  name: string;
  selectedInterests: string[];
  selectedPersonality: string;
  onStartExploring: () => void;
};

export function SuccessScreen({
  name,
  selectedInterests,
  selectedPersonality,
  onStartExploring,
}: SuccessScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();

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
    sparkleBubble: {
      width: moderateScale(138),
      height: moderateScale(138),
      borderRadius: moderateScale(69),
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
    headingBlock: {
      alignItems: "center",
      gap: verticalScale(10),
    },
    title: {
      fontSize: moderateScale(42),
      lineHeight: moderateScale(50),
      fontWeight: "900",
      color: colors.white,
      textAlign: "center",
    },
    subtitle: {
      fontSize: moderateScale(19),
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
    },
    summaryCard: {
      width: "100%",
      borderRadius: moderateScale(28),
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.38)",
      padding: moderateScale(22),
      gap: verticalScale(16),
    },
    whiteButton: {
      width: "100%",
      backgroundColor: colors.white,
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
        <View style={styles.sparkleBubble}>
          <Feather name="zap" size={moderateScale(78)} color={colors.primary} />
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.title}>Welcome, {name}!</Text>
          <Text style={styles.subtitle}>Welcome to the ShakeShake experience</Text>
        </View>

        <View style={styles.summaryCard}>
          <SummaryItem
            title="Profile Created"
            subtitle={`${selectedInterests.length} interests added`}
          />
          <SummaryItem
            title="Vibe Matched"
            subtitle={`${selectedPersonality || "Selected"} energy`}
          />
        </View>

        <AppButton
          title="Start Exploring"
          onPress={onStartExploring}
          variant="white"
          style={styles.whiteButton}
        />
      </View>
    </LinearGradient>
  );
}

type SummaryItemProps = {
  title: string;
  subtitle: string;
};

function SummaryItem({ title, subtitle }: SummaryItemProps) {
  const { colors } = useThemeContext();

  const styles = StyleSheet.create({
    summaryItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: moderateScale(12),
    },
    checkCircle: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: moderateScale(18),
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    summaryTextBlock: {
      flex: 1,
    },
    summaryTitle: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.white,
      marginBottom: 2,
    },
    summarySubtitle: {
      fontSize: moderateScale(14),
      color: "rgba(255,255,255,0.82)",
    },
  });

  return (
    <View style={styles.summaryItem}>
      <View style={styles.checkCircle}>
        <Feather name="check" size={moderateScale(18)} color={colors.primary} strokeWidth={3} />
      </View>
      <View style={styles.summaryTextBlock}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summarySubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
